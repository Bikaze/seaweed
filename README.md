# Katisha Ticket Vault

Express API for ticket upload/download URL signing using SeaweedFS S3, with ticket metadata stored in Postgres.

## Stack

- Node.js + Express
- SeaweedFS: master, volume, filer, s3
- Postgres for app data and filer metadata
- AWS SDK v3 for signed URLs
- Docker Compose for local infrastructure

## Project Structure

- src/app.js: Express app startup and DB bootstrap for app table
- src/routes/tickets.js: API routes
- src/controllers/tickets.js: Upload/download signing + confirm save
- src/config/s3.js: AWS S3 client for Seaweed endpoint
- src/config/db.js: Postgres pool
- docker-compose.yml: Seaweed + Postgres + init job
- seaweedfs/filer.toml: Filer metadata backend config (postgres2)
- cors.json: Bucket CORS rules applied at startup

## Prerequisites

- Docker + Docker Compose
- Node.js 18+
- npm
- AWS CLI (optional but recommended for local checks)

## Environment

Copy `.env.example` to `.env` and adjust if needed.

Expected keys:

- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY
- S3_ENDPOINT
- S3_ENDPOINT_INTERNAL
- S3_BUCKET
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME

## Start Infrastructure

```bash
docker compose up -d
```

What happens on startup:

- Seaweed services start
- Postgres starts with persistent volume
- `s3-init` waits for S3 health, then:
  - creates bucket from `S3_BUCKET` if missing
  - applies CORS from `cors.json`

## Start API

```bash
npm install
npm start
```

API runs at `http://localhost:3000`.

On startup, app ensures `bus_tickets` table exists.

## API Endpoints

Base path: `/api/tickets`

### 1) Request upload URL

`POST /upload-request`

Response:

```json
{
  "uploadUrl": "...",
  "cleanPath": "/tickets/ticket_<uuid>.pdf"
}
```

### 2) Confirm upload

`POST /confirm`

Body:

```json
{
  "file_path": "/tickets/ticket_<uuid>.pdf",
  "passengerName": "Clement"
}
```

Response: inserted row from `bus_tickets`.

### 3) Request download URL

`GET /download-request?path=/tickets/ticket_<uuid>.pdf`

Response:

```json
{
  "downloadUrl": "..."
}
```

Important: `path` query parameter is required.

## AWS CLI Local Usage

List buckets:

```bash
aws --profile seaweed-local --endpoint-url http://localhost:8333 s3 ls
```

List bucket contents:

```bash
aws --profile seaweed-local --endpoint-url http://localhost:8333 s3 ls s3://katisha --recursive
```

If you prefer env vars instead of profile:

```bash
AWS_ACCESS_KEY_ID=seaweedfs \
AWS_SECRET_ACCESS_KEY=S3cr3tSeaw33d \
AWS_DEFAULT_REGION=us-east-1 \
aws --endpoint-url http://localhost:8333 s3 ls
```

## Data Persistence

Docker volumes in compose:

- db_data: Postgres data
- seaweed_master_data: Seaweed master state
- seaweed_volume_data: Seaweed object/chunk data

Filer metadata is stored in Postgres via `seaweedfs/filer.toml` (`postgres2`).

## Troubleshooting

### Signature failed (upload-request)

Typical causes:

- Missing or wrong S3 credentials in `.env`
- Wrong endpoint in `S3_ENDPOINT`
- Bucket in `S3_BUCKET` does not exist
- API not restarted after env changes

Checks:

```bash
aws --profile seaweed-local --endpoint-url http://localhost:8333 s3 ls
```

### Database save failed (confirm)

Cause: `bus_tickets` table missing or DB connectivity issue.

Current app bootstraps this table at startup. Ensure app starts cleanly.

### Failed to generate download link (download-request)

Common cause: missing `path` query value.

Use:

```text
/api/tickets/download-request?path=/tickets/ticket_<uuid>.pdf
```

### CORS issues in browser uploads/downloads

Verify current bucket CORS:

```bash
aws --profile seaweed-local --endpoint-url http://localhost:8333 s3api get-bucket-cors --bucket katisha
```

### `docker volume rm ... volume is in use`

A container still references the volume.

```bash
docker compose down
docker volume rm <volume_name>
```

## Useful Commands

```bash
# Service status
docker compose ps

# Logs
docker compose logs -f s3
docker compose logs -f filer
docker compose logs -f s3-init

# DB tables
docker compose exec -T db psql -U user -d seaweed_metadata -c "\\dt"

# Buckets metadata rows
docker compose exec -T db psql -U user -d seaweed_metadata -c "SELECT name, directory FROM filemeta WHERE directory = '/buckets';"
```
