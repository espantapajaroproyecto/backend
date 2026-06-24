# CEI App — Backend Deployment Guide

**AWS Account:** 323668150862 (Instituto Espantapájaros)
**Region:** us-east-1
**Data store:** Amazon S3 (no RDS — by design for cost reasons)
**Framework:** Serverless Framework v3.40.0

---

## Prerequisites

### AWS Account Setup

The deploy IAM user (`deploy-cei-app`) must have the following managed policies attached:

- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `AWSCloudFormationFullAccess`
- `AmazonS3FullAccess`
- `IAMFullAccess` (needed so Serverless can create Lambda execution roles)
- `AmazonSSMReadOnlyAccess` (needed to read secrets from Parameter Store at deploy time)

Configure credentials locally:

```bash
aws configure
# AWS Access Key ID: <deploy-cei-app key>
# AWS Secret Access Key: <deploy-cei-app secret>
# Default region name: us-east-1
# Default output format: json
```

Verify identity before deploying:

```bash
aws sts get-caller-identity
# Expected: Account: 323668150862, user: deploy-cei-app
```

### Required Tools

```bash
node -v          # Must be >= 20.x
npm -v           # >= 10.x
serverless -v    # Must be 3.40.0 — install with: npm install -g serverless@3.40.0
aws --version    # AWS CLI v2
```

---

## Step 1 — Create the S3 Data Bucket

The bucket stores all application data as JSON files (users, reservations, teachers, etc.).

```bash
# Create bucket
aws s3api create-bucket \
  --bucket cei-espantapajaros-data-prod \
  --region us-east-1

# Block all public access
aws s3api put-public-access-block \
  --bucket cei-espantapajaros-data-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption at rest (SSE-S3)
aws s3api put-bucket-encryption \
  --bucket cei-espantapajaros-data-prod \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

# Enable versioning (allows data recovery)
aws s3api put-bucket-versioning \
  --bucket cei-espantapajaros-data-prod \
  --versioning-configuration Status=Enabled
```

Verify:

```bash
aws s3api get-bucket-encryption --bucket cei-espantapajaros-data-prod
aws s3api get-public-access-block --bucket cei-espantapajaros-data-prod
aws s3api get-bucket-versioning --bucket cei-espantapajaros-data-prod
```

---

## Step 2 — Store the JWT Secret in Parameter Store

The JWT secret must NOT be in source code or environment files. It lives in AWS Systems Manager Parameter Store as a SecureString.

```bash
# Replace <your-strong-secret> with a random 32+ character string
aws ssm put-parameter \
  --name /cei/prod/jwt-secret \
  --type SecureString \
  --value "<your-strong-secret>" \
  --description "JWT signing secret for CEI App production"

# Generate a strong secret if you need one:
# openssl rand -base64 48
```

To rotate the secret in the future:

```bash
aws ssm put-parameter \
  --name /cei/prod/jwt-secret \
  --type SecureString \
  --value "<new-secret>" \
  --overwrite
# Then redeploy: sls deploy --stage prod
```

---

## Step 3 — Deploy Lambda Functions + API Gateway

```bash
cd /path/to/backend
npm install

# Deploy to production
serverless deploy --stage prod
```

Serverless will create:

- A CloudFormation stack named `cei-espantapajaros-prod`
- 22 Lambda functions (see list below)
- 1 API Gateway REST API with all routes and the Lambda authorizer wired in
- 1 Lambda execution IAM role with least-privilege S3 access
- CloudWatch Log Groups for each function
- A Serverless deployment bucket (`serverless-deployment-<hash>-us-east-1`)

### Deployed Lambda Functions and Routes

| Function | Method | Path | Auth required |
|---|---|---|---|
| `usuarioLogin` | POST | `/login` | No |
| `agregarUsuario` | POST | `/usuario` | No |
| `obtenerUsuarios` | GET | `/usuario` | Yes |
| `modificarUsuario` | PUT | `/usuario` | Yes |
| `agregarAlumno` | POST | `/alumno` | No |
| `obtenerAlumnos` | GET | `/alumno` | Yes |
| `modificarAlumno` | PUT | `/alumno` | Yes |
| `eliminarAlumno` | DELETE | `/alumno` | Yes |
| `agregarReserva` | POST | `/reserva` | Yes |
| `obtenerReservas` | GET | `/reserva` | Yes |
| `modificarReserva` | PUT | `/reserva` | Yes |
| `eliminarReserva` | DELETE | `/reserva` | Yes |
| `obtenerDocentes` | GET | `/profesor` | No |
| `agregarDocente` | POST | `/profesor` | Yes |
| `modificarDocente` | PUT | `/profesor` | Yes |
| `eliminarDocente` | DELETE | `/profesor` | Yes |
| `obtenerConfiguraciones` | GET | `/configuracion` | No |
| `agregarConfiguraciones` | POST | `/configuracion` | Yes |
| `modificarConfiguraciones` | PUT | `/configuracion` | Yes |
| `eliminarConfiguraciones` | DELETE | `/configuracion` | Yes |
| `obtenerDisponibles` | GET | `/disponible` | No |
| `lambdaAutorizer` | (authorizer) | — | — |
| `cargarDataS3` | (invoke manually) | — | — |

### Get the API Gateway URL after deploy

After `serverless deploy` completes, the output includes:

```
endpoints:
  POST - https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod/login
  POST - https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod/usuario
  ...
```

The base URL is `https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod`. Put this in `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
```

---

## Step 4 — Seed Initial Data

The `cargarDataS3` Lambda loads all JSON files from `data/clases/` into the S3 bucket. This replaces whatever is currently in the bucket.

```bash
# Invoke the seeding Lambda directly (no API Gateway exposure)
serverless invoke --function cargarDataS3 --stage prod

# Expected response:
# { "statusCode": 200, "body": "{\"mensaje\":\"Carga completada.\",\"archivosSubidos\":[...]}" }
```

Seed files live in `backend/data/clases/`. The most important ones:

| File | Contents |
|---|---|
| `usuarios.json` | Users (admins, teachers, students) with bcrypt-hashed passwords |
| `profesores.json` | Teacher profiles linked to users |
| `alumnos.json` | Student profiles linked to users |
| `materias.json`, `temas.json` | Subjects and topics |
| `disponibles.json` | Teacher availability blocks |
| `reservas.json` | Booking records |

**Default test credentials** (from seed data):

| Role | DNI | Password |
|---|---|---|
| Admin | 67890999 | (see note below) |
| Student | 67890123 | (see note below) |
| Teacher | 67890124 | (see note below) |

> **Note:** All seed users share the same bcrypt hash in `usuarios.json`. To set a known password for testing, regenerate the hash:
>
> ```bash
> node -e "const b=require('bcryptjs'); b.hash('TestPassword123!',10).then(h=>console.log(h))"
> ```
>
> Then replace all `contrasenia` values in `data/clases/usuarios.json` with the new hash, and re-run the seeding step.

---

## Step 5 — Smoke Test

After seeding, verify the login endpoint returns a JWT:

```bash
curl -s -X POST \
  https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod/login \
  -H "Content-Type: application/json" \
  -d '{"body":"{\"dni\":\"67890999\",\"contrasenia\":\"TestPassword123!\"}"}' \
  | python3 -m json.tool
```

Expected response:

```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Environment Variables Reference

| Variable | Where it lives | Description |
|---|---|---|
| `USE_S3` | `serverless.yml` (hardcoded `true`) | Data store mode — always true in prod |
| `S3_BUCKET` | `serverless.yml` (hardcoded) | Data bucket name |
| `JWT_SECRET` | AWS SSM Parameter Store `/cei/prod/jwt-secret` | JWT signing secret — rotate via SSM |
| `AWS_REGION` | Lambda runtime default | Set automatically by Lambda |

Variables **not needed** in production (S3 mode): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## How to Redeploy a Single Function

To deploy only one function after a code change (much faster than full deploy):

```bash
serverless deploy function --function obtenerReservas --stage prod
```

---

## How to Roll Back

```bash
# List recent deployments
serverless rollback list --stage prod

# Roll back to a specific timestamp
serverless rollback --timestamp 1234567890000 --stage prod

# Or remove the entire stack (DESTRUCTIVE — deletes all Lambdas and API Gateway)
serverless remove --stage prod
```

---

## Updating CORS After Frontend Deploy

After the frontend URL is known (e.g. `https://xxx.amplifyapp.com`), update CORS in `utils/utils.js`:

```js
// Change the default in makeHeader():
const makeHeader = (
  allowOrigin = "https://xxx.amplifyapp.com",  // replace * with actual domain
  ...
)
```

Then redeploy all functions:

```bash
serverless deploy --stage prod
```

---

## Estimated Monthly Cost (us-east-1, 2026 pricing)

At the institute's usage level (~50 students, ~60 weekly classes):

| Service | Estimated monthly cost |
|---|---|
| AWS Lambda (≈ 10,000 invocations/month, avg 200ms) | < $0.01 |
| API Gateway REST API (10,000 requests/month) | ~$0.04 |
| S3 storage (< 1 MB of JSON data) | < $0.01 |
| S3 requests (< 50,000/month) | < $0.03 |
| CloudWatch Logs (minimal) | < $0.01 |
| SSM Parameter Store (1 SecureString) | $0.00 (free tier) |
| **Total** | **< $0.10/month** |

This is effectively free. The only cost that could grow is if log retention is not configured — set CloudWatch log groups to expire after 30 days to avoid accumulation.

---

## Security Checklist

- [x] S3 bucket has all public access blocked
- [x] S3 bucket has encryption at rest (SSE-S3)
- [x] S3 bucket has versioning enabled
- [x] Lambda execution role has only S3 + CloudWatch Logs access (no wildcard resource on S3 — scoped to `cei-espantapajaros-data-prod`)
- [x] `JWT_SECRET` is not in source code — lives in SSM Parameter Store as SecureString
- [x] JWT tokens expire after 8 hours
- [x] Lambda authorizer validates token on all non-public routes
- [x] No `*` permissions on IAM for the Lambda execution role
- [x] No RDS — no VPC, no security groups, no DB credentials to manage
- [ ] CORS `Access-Control-Allow-Origin: *` — **update to frontend domain once known** (see `utils/utils.js`)
- [ ] API Gateway access logging — optional, enable via console if audit trail is needed

---

## Deployer IAM User — Recommended Cleanup

After the initial deploy, the `deploy-cei-app` IAM user has `IAMFullAccess` which is broad. Once the Lambda execution role exists in the account, you can replace it with a more restrictive policy. This is optional for a small internal project but good practice.
