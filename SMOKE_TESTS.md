# Manual Smoke Checks

This guide is for quick human verification that the current server is usable in a local self-hosted setup.

## Local Boot

### 1. Start dependencies

Make sure Postgres is available with the values from [.env.example](./.env.example), or update `.env` for your local database.

### 2. Start the server

```bash
cp .env.example .env
pnpm install
pnpm run start
```

Expected result:

- the process starts without crashing
- startup logs mention migrations or `No migrations to run!`
- the server listens on `http://localhost:3000`

### 3. Check health

```bash
curl http://localhost:3000/health
```

Expected result:

- HTTP `200`
- response body contains `status: "ok"`
- dependency checks are present under `details.checks`

## Upload And Import

### 1. Upload a supported file

Use any small `.epub`, `.pdf`, `.cbz`, or `.cbr` file:

```bash
curl \
  -X POST \
  -F "file=@/absolute/path/to/book.epub" \
  http://localhost:3000/imports
```

Expected result:

- HTTP `201`
- response body contains an `importJob`
- `importJob.source.kind` is `upload`
- `importJob.detectedFileType` matches the uploaded file

### 2. Check import status

Take the returned import job id and fetch it:

```bash
curl http://localhost:3000/imports/<import-job-id>
```

Expected result:

- HTTP `200`
- the same import job is returned
- metadata candidates or duplicate information appear when available

### 3. Reject an unsupported upload

```bash
curl \
  -X POST \
  -F "file=@/absolute/path/to/file.txt" \
  http://localhost:3000/imports
```

Expected result:

- HTTP `400`
- error code is `unsupported_import_file_extension`

## Browse

### 1. Create a book

```bash
curl \
  -X POST \
  -H "content-type: application/json" \
  -d '{"title":"The Left Hand of Darkness","authors":["Ursula K. Le Guin"]}' \
  http://localhost:3000/books
```

Expected result:

- HTTP `201`
- response body contains a created `book`

### 2. List books

```bash
curl http://localhost:3000/books
```

Expected result:

- HTTP `200`
- response body contains `books`
- the newly created book appears in the list

### 3. Fetch one book

```bash
curl http://localhost:3000/books/<book-id>
```

Expected result:

- HTTP `200`
- the fetched record matches the created book

## Graceful Shutdown

### Local process

With `pnpm run start` still running, send `Ctrl+C`.

Expected result:

- the process logs that graceful shutdown started
- the server stops cleanly
- persistence connections are closed
- the process exits without hanging

### Docker Compose

```bash
docker compose up --build
docker compose stop
```

Expected result:

- both services become healthy after startup
- `litlocker-server` responds on `http://localhost:3000/health`
- `docker compose stop` shuts the app down without a forced kill during the normal grace period

## Optional Compose Validation

```bash
docker compose config
```

Expected result:

- the compose file resolves successfully
- both `litlocker-postgres` and `litlocker-server` have healthchecks
