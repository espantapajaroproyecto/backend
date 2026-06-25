# Security Notes — CEI App Backend

## P1: Credentials in URL (auth-form.tsx)

**Root cause — Next.js SSR hydration race**

When Next.js renders a page, it sends HTML to the browser immediately (SSR). The HTML contains the `<form>` element. At this point React has NOT yet attached its JavaScript event listeners — there is a brief window (tens to hundreds of milliseconds on a slow connection or device) before the JS bundle downloads and React "hydrates" the page.

If a user clicks submit during this window, the browser fires its native form submission. Without a `method="post"` attribute, the browser defaults to `GET` — and a GET form encodes all named `<input>` values as URL query parameters. Credentials appear in the browser address bar, in the browser history, in server access logs, in Referer headers sent to third parties, and in any CDN or proxy cache between the user and the server.

**Fix (frontend/components/auth-form.tsx)**

```tsx
<form
  onSubmit={handleSubmit}
  method="post"   // ← added
  noValidate
>
```

The `e.preventDefault()` in `handleSubmit` remains — it stops the POST submission once React is live. `method="post"` is the safety net for the pre-hydration window. With both in place, credentials can only travel in POST body (HTTPS encrypted) — never in the URL under any code path.

**All auth flows checked**

- login/page.tsx → uses AuthForm → fixed ✅
- register/page.tsx → uses AuthForm → fixed ✅
- There is no "recover" or "reset" page that renders credentials in a form yet.

---

## P2: Credentials and PII in CloudWatch Logs

**Why credential logging is a real risk**

CloudWatch log groups are accessible to any IAM principal with `logs:GetLogEvents` permission. That includes:
- Every AWS account admin (a broader group than application developers)
- Any Lambda execution role that has CloudWatch access (if over-provisioned)
- Any CI/CD pipeline with deployment permissions
- A compromised AWS credential at any of these permission levels

Even bcrypt hashes in logs are a risk: an attacker with log access can run an offline dictionary attack against the hash without touching the live system. The AWS Well-Architected Framework explicitly prohibits storing secrets in logs.

**Changes made**

`functions/login/usuarioLogin.js`:
- Removed `console.log(body)` — was logging plaintext password
- Removed `console.log(JSON.stringify(user))` — was logging full PII + bcrypt hash for every user in the dataset
- Removed `console.log(user[0].contrasenia)` — explicit hash logging
- Removed `console.log(user.length)`, `console.log(isValid)` — harmless but noisy
- Kept: zero logging (the Lambda now logs only on error via `console.error`)

`functions/docente/modificarDocente.js`:
- Removed `console.log({ event })` — logged the full API Gateway event including `authorizationToken` header (JWT token), all request headers, and the request body with user PII

`functions/docente/agregarDocente.js`:
- Removed `console.log("nuevoDocente", nuevoDocente)` — logged teacher user object
- Fixed JWT `expiresIn` for new teachers: tokens previously never expired (commented-out option). Now `{ expiresIn: "8h" }` matches the login token lifetime.

`functions/reserva/obtenerReservas.js`:
- Removed `console.log(cuerpo)` — logged the request body (contains `usuarioId`)

**Log retention guidance**

Set a CloudWatch log retention policy on Lambda log groups (e.g. 14 days). By default CloudWatch never deletes logs — old sensitive data accumulates indefinitely. Run:

```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/cei-espantapajaros-prod-usuarioLogin \
  --retention-in-days 14
```

Repeat for each Lambda log group.

---

## P3b: CORS Headers on API Gateway Error Responses

**Why authorizer denials appeared as CORS errors**

When the Lambda authorizer rejects a request (missing token, expired token, wrong format), API Gateway generates the HTTP 401/403 response itself — the Lambda function code never runs. Since CORS headers were only added inside Lambda code (`makeHeader()`), these gateway-level errors had NO CORS headers. The browser's preflight mechanism saw "no Access-Control-Allow-Origin" and reported it as a CORS error, hiding the real issue (unauthorized).

**Fix (serverless.yml)**

Added four `GatewayResponses` CloudFormation resources:
- `DEFAULT_4XX` — all 4xx gateway errors
- `DEFAULT_5XX` — all 5xx gateway errors  
- `UNAUTHORIZED` — authorizer returns "Unauthorized"
- `ACCESS_DENIED` — authorizer explicitly denies access

These inject the same CORS headers as `makeHeader()` at the API Gateway layer, so the browser receives the real HTTP status code and can show the correct error (e.g. "session expired, please log in again").

---

## Pending

- [ ] Lock `Access-Control-Allow-Origin` from `"*"` to the Amplify domain once frontend is deployed. Change in: `backend/utils/utils.js` (`makeHeader()` default) AND in all four `GatewayResponses` blocks in `serverless.yml`.
- [ ] Set CloudWatch log retention policies on all Lambda log groups (see P2 guidance above).
- [ ] Rotate `JWT_SECRET` in SSM if any version of the old logging code ran in production — the full JWT payload was logged by `console.log({ event })` in `modificarDocente.js`.
