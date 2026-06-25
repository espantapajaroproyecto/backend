# CEI App — Backend

AWS Lambda + API Gateway backend for the Instituto Espantapájaros class reservation system. All data is stored as JSON in S3 — no relational database.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20, AWS Lambda |
| Framework | Serverless Framework v3.40.0 |
| API | API Gateway REST (Lambda Proxy integration) |
| Data store | Amazon S3 (`USE_S3=true`, always) |
| Auth | Lambda Authorizer (token type) + JWT (`jsonwebtoken`) |
| Password hashing | bcryptjs (cost factor 10) |
| Secrets | AWS SSM Parameter Store (JWT secret as SecureString) |

---

## Getting Started

**Requires:** Node 20+, AWS CLI v2, Serverless Framework v3.40.0, credentials for the `deploy-cei-app` IAM user in `~/.aws/credentials`.

```bash
cd backend
npm install
serverless deploy --stage prod
```

To reseed S3 data:
```bash
# Preferred — upload files directly (avoids stale Lambda bundle):
aws s3 cp data/clases/usuarios.json s3://cei-espantapajaros-data-prod/usuarios.json

# Full reseed (only safe if cargarDataS3 Lambda was redeployed after local JSON edits):
serverless invoke --function cargarDataS3 --stage prod
```

> **Warning:** `cargarDataS3` has `data/clases/` baked into its bundle at deploy time. Edit a JSON locally → upload directly to S3, or redeploy the Lambda first.

---

## Environment Variables

`backend/.env` (not committed — AWS credentials must NEVER go here, only in `~/.aws/credentials`):

| Variable | Where it actually lives | Notes |
|---|---|---|
| `USE_S3` | `.env` → Lambda env | Always `true` |
| `JWT_SECRET` | SSM `/cei/prod/jwt-secret` (SecureString) | Fetched at deploy time by `serverless.yml` |
| `S3_BUCKET` | `serverless.yml` (hardcoded) | `cei-espantapajaros-data-prod` |
| `DB_*` | `.env` (ignored) | No RDS in production |

---

## Folder Structure

```
backend/
├── functions/               # One folder per Lambda handler
│   ├── login/               # POST /login
│   ├── usuario/             # GET/POST/PUT /usuario
│   ├── alumno/              # GET/POST/PUT/DELETE /alumno
│   ├── docente/             # GET/POST/PUT/DELETE /profesor
│   ├── reserva/             # GET/POST/PUT/DELETE /reserva
│   ├── configuracion/       # GET/POST/PUT/DELETE /configuracion
│   ├── disponible/          # GET /disponible
│   └── auth/                # lambdaAutorizer.js
├── services/
│   ├── s3Service.js         # All S3 read/write logic (the data layer)
│   └── dbService.js         # PostgreSQL stubs — unused, has known bugs
├── utils/
│   ├── utils.js             # hashPassword(), compararContrasenias(), makeHeader()
│   └── cargarDataS3.js      # Seeding utility
├── data/clases/             # JSON seed files
├── database/init.sql        # PostgreSQL schema (reference only)
├── serverless.yml           # Routes, authorizer, IAM, SSM, GatewayResponses
├── DEPLOYMENT.md            # Full ops runbook
└── SECURITY-NOTES.md        # Security decisions and outstanding items
```

---

## API Routes

| Method | Path | Auth | Lambda |
|---|---|---|---|
| POST | `/login` | No | `usuarioLogin` |
| POST | `/usuario` | No | `agregarUsuario` |
| GET | `/usuario` | Yes | `obtenerUsuarios` |
| PUT | `/usuario` | Yes | `modificarUsuario` |
| POST | `/alumno` | No | `agregarAlumno` |
| GET | `/alumno` | Yes | `obtenerAlumnos` |
| PUT | `/alumno` | Yes | `modificarAlumno` |
| DELETE | `/alumno` | Yes | `eliminarAlumno` |
| GET | `/profesor` | No | `obtenerDocentes` |
| POST | `/profesor` | Yes | `agregarDocente` |
| PUT | `/profesor` | Yes | `modificarDocente` |
| DELETE | `/profesor` | Yes | `eliminarDocente` |
| GET | `/configuracion` | No | `obtenerConfiguraciones` |
| POST | `/configuracion` | Yes | `agregarConfiguraciones` |
| PUT | `/configuracion` | Yes | `modificarConfiguraciones` |
| DELETE | `/configuracion` | Yes | `eliminarConfiguraciones` |
| GET | `/disponible` | No | `obtenerDisponibles` |
| POST | `/reserva` | Yes | `agregarReserva` |
| GET | `/reserva` | Yes | `obtenerReservas` |
| PUT | `/reserva` | Yes | `modificarReserva` |
| DELETE | `/reserva` | Yes | `eliminarReserva` |

---

## Lambda Response Contract

Every Lambda returns:

```js
{
  statusCode: 200,
  headers: makeHeader(),          // CORS headers
  body: JSON.stringify({ ... }),  // String — API Gateway sends this as HTTP body
}
```

API Gateway unwraps `body` into the HTTP response body. Axios parses JSON automatically. On the frontend, `response.data` is already the parsed object — never `response.data.body`.

---

## Lambda Authorizer

`functions/auth/lambdaAutorizer.js` reads `event.authorizationToken` (format: `Bearer <jwt>`), verifies the JWT, and returns an IAM Allow/Deny policy. On denial, API Gateway returns 403 directly — the Lambda handler never runs, so no CORS headers would be present without the `GatewayResponses` resources in `serverless.yml`.

---

## Security Model

### Passwords in transit — TLS

The API Gateway endpoint is `https://` only. No `http://` URLs exist in either repo. Passwords travel as plain text inside the HTTPS-encrypted request body — this is correct.

**Do NOT hash passwords in the browser before sending.** Client-side hashing turns the hash into a replayable credential: anyone who intercepts it can replay it without knowing the original password. It provides zero security benefit over TLS and breaks bcrypt's ability to salt properly. The correct model is: **TLS protects transit, bcrypt protects storage**.

### Passwords at rest — bcrypt (cost factor 10)

`utils/utils.js`:

```js
// On user creation / password update:
hashPassword(plain)                       →  bcrypt.hash(plain, 10)

// On login:
compararContrasenias(input, storedHash)   →  bcrypt.compare(input, storedHash)
```

Every creation Lambda (`agregarAlumno`, `agregarDocente`, `agregarUsuario`) calls `hashPassword()` before writing to S3. `usuarioLogin.js` calls `compararContrasenias()` — never a string equality check.

Cost factor 10: enough rounds to make brute force slow, fast enough to stay under Lambda timeout.

### JWT tokens

- Signed with `JWT_SECRET` from SSM (never hardcoded)
- Expiry: 8 hours (`{ expiresIn: "8h" }`)
- Payload: `usuarioId`, `dni`, `nombre`, `apellido`, `mail`, `celular`, `rol`
- Stored in `sessionStorage` on the frontend (clears on tab close, unlike `localStorage`)

### No secrets in logs

All sensitive log statements have been removed across both sessions (see Changelog). The rule: never log request bodies, response bodies containing user data, auth headers, passwords, hashes, or tokens. CloudWatch logs are accessible to any IAM principal with `logs:GetLogEvents` — treat them as semi-public.

### CORS

`Access-Control-Allow-Origin: *` currently. `GatewayResponses` in `serverless.yml` ensure CORS headers appear on gateway-level errors (authorizer denials) as well as Lambda responses.

**Pending:** Change `*` to the Amplify domain in `utils/utils.js` `makeHeader()` and in all four `GatewayResponses` blocks in `serverless.yml`.

---

## npm Scripts

```bash
npm run local <functionName>   # Invoke a Lambda locally via Serverless Framework
npm run local:evento           # Simulate an event via utils/bash/ejecutar-test-local.sh
npm run reload:s3              # Invoke cargarDataS3 locally
npm run package                # Bundle with Webpack for deployment
```

---

## Known Issues

- `dbService.js` has column name bugs (`username`/`telefono` instead of `mail`/`celular`/`apellido`) and PostgreSQL syntax errors — not used while `USE_S3=true`.
- `init.sql` schema has duplicate PRIMARY KEY on `profesor`/`alumno` and a wrong FK in `profesor_tiene_reserva`.
- `obtenerReservas.js` reads filter params from `event.body`; GET requests have no body. `getReservasUsuario()` sends `usuarioId` as a query param that the Lambda ignores — all reservations are returned.
- Email verification and password recovery Lambda handlers are not yet implemented.

---

## Changelog

### 2026-06-24 (Session 3 — Security audit + documentation)
- **`utils.js` critical fix** — `compararContrasenias()` was calling `console.log(inputPassword, storedHashedPassword)`, logging the **plaintext password** and bcrypt hash to CloudWatch on every login. Removed.
- **`s3Service.js` hash log fixes** — `obtenerDocentes()` logged the full `docente` object (including `docente.usuario.contrasenia`) before the `delete` stripped it. `modificarUsuario()` logged `modificarParams` which includes the bcrypt hash when called from a password-change flow. Both removed.
- **README files created** — This file and `frontend/README.md` established as living documentation. Changelog section to be maintained going forward.

### 2026-06-24 (Session 2 — AWS deployment + security hardening)
- **GatewayResponses** — Four CloudFormation resources added to `serverless.yml` injecting CORS headers on all API Gateway-level errors (4xx, 5xx, UNAUTHORIZED, ACCESS_DENIED). Previously, authorizer denials returned 401/403 with no CORS headers, which the browser misreported as CORS errors masking the real problem.
- **PII/credential logging removed** — `usuarioLogin.js` (plaintext password, full user PII + bcrypt hash), `modificarDocente.js` (full event object including JWT in header), `agregarDocente.js` (teacher data), `obtenerReservas.js` (request body).
- **JWT expiry fixed** — `agregarDocente.js` signed tokens without `expiresIn` — teacher JWTs never expired. Fixed to `{ expiresIn: "8h" }`.

### 2026-06-24 (Session 1 — Initial deployment)
- **S3 bucket** — Created `cei-espantapajaros-data-prod` with public-access block, AES256 encryption at rest, versioning enabled.
- **SSM secret** — JWT secret stored at `/cei/prod/jwt-secret` as SecureString.
- **Full deploy** — All 23 Lambdas live at `https://p875mdhij9.execute-api.us-east-1.amazonaws.com/prod`.
- **CORS methods fix** — `makeHeader()` default was `GET,OPTIONS`; POST was missing. Updated to `GET,POST,PUT,DELETE,OPTIONS`.
- **Login 500 fix** — Axios call passed payload and headers merged into the second argument. Lambda received a nested body; `bcrypt.compare(undefined, hash)` threw. Fixed call signature and response parsing.
- **Seed password reset** — All 41 seed users updated to `Espanta2024!`; hash written to `data/clases/usuarios.json` and uploaded directly to S3.
