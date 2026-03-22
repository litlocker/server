# LitLocker Server

LitLocker is a self-hosted digital library project inspired by BookLore.

This repository contains the server/API for the project. It is designed as a web-first backend for managing EPUB, PDF, and comic libraries with a clean ports-and-adapters architecture, explicit contracts, and deployment paths that stay understandable for self-hosters.

## What It Does Today

The current server can:

- manage books with metadata, authors, tags, series, cover data, and file references
- manage manual shelves and shelf membership
- ingest uploads into an import pipeline
- extract and enrich import metadata through a metadata-provider seam
- detect duplicate imports
- store reading progress
- persist data in Postgres
- protect API routes with OIDC-backed auth when enabled
- expose structured logs, health checks, rate limits, upload validation, and shutdown gracefully

Current implemented route groups:

- `GET /health`
- books:
  - `POST /books`
  - `GET /books`
  - `GET /books/:id`
  - `PATCH /books/:id`
- shelves:
  - `POST /shelves`
  - `GET /shelves`
  - `PATCH /shelves/:id`
  - `DELETE /shelves/:id`
  - `POST /shelves/:id/books/:bookId`
  - `DELETE /shelves/:id/books/:bookId`
- imports:
  - `POST /imports`
  - `GET /imports`
  - `GET /imports/:id`
  - `POST /imports/:id/finalize`
- reading progress:
  - `GET /progress/:bookId`
  - `POST /progress`

## Project Status

This is still an early server-first foundation, but it is not a toy skeleton. The project now has:

- real Postgres persistence
- migrations with `node-pg-migrate`
- self-hosting with docker
- health checks and structured logging
- import, browse, and reading-progress flows

Still intentionally not finished but planned:

- richer reader delivery flows
- OPDS and device sync
- broader ecosystem features
- more polished contributor and operator tooling

## Self-Hosting

### Requirements

- Node.js `24`
- `pnpm` `10`
- Postgres `15+` or Docker

### Recommended: Docker Compose

The repository includes:

- [Dockerfile](./Dockerfile)
- [docker-compose.yaml](./docker-compose.yaml)

Quick start:

```bash
cp .env.example .env
docker compose up --build
```

Expected result:

- `litlocker-server` is available on `http://localhost:3000`
- `litlocker-postgres` is available on `localhost:15432`
- both containers have health checks
- the app runs pending migrations automatically on startup

Persistent volumes in the compose stack:

- Postgres data
- library files
- import staging files
- cover files

### Local Development / Local Self-Hosting

If you want to run directly on the host:

```bash
cp .env.example .env
pnpm install
pnpm run start
```

The default local database values are:

- host: `localhost`
- port: `15432`
- user: `devdb`
- password: `devpass`
- database: `devdb`
- schema: `litlocker`

The app will:

- validate env configuration at startup
- run pending migrations
- start serving on `http://localhost:3000` by default

## Configuration

All current environment variables are shown in [.env.example](./.env.example).

### Server

- `SERVER__HTTP__ADDRESS`
- `SERVER__HTTP__PORT`
- `SERVER__HTTP__TIMEOUT_MS`

### Storage

- `STORAGE__PATHS__LIBRARY`
- `STORAGE__PATHS__IMPORTS`
- `STORAGE__PATHS__COVERS`

These paths are used for:

- finalized library files
- temporary import staging
- stored cover assets

### Imports

- `IMPORTS__MAX_FILE_SIZE_IN_BYTES`
- `IMPORTS__ALLOWED_FILE_EXTENSIONS`
- `IMPORTS__DUPLICATE_CHECK_ENABLED`
- `IMPORTS__UPLOAD_RATE_LIMIT__WINDOW_MS`
- `IMPORTS__UPLOAD_RATE_LIMIT__MAX_REQUESTS`

### Database

- `DATABASE__HOST`
- `DATABASE__PORT`
- `DATABASE__USER`
- `DATABASE__PASSWORD`
- `DATABASE__DATABASE`
- `DATABASE__SCHEMA`
- `DATABASE__SSL_ENABLED`
- `DATABASE__POOL_MAX_CONNECTIONS`
- `DATABASE__POOL_IDLE_TIMEOUT_MS`
- `DATABASE__CONNECTION_TIMEOUT_MS`

Important implementation details:

- the app uses the `litlocker` Postgres schema by default
- the project uses handwritten SQL via `pg`
- no ORM is used
- no database-native foreign keys are used

### Auth

- `AUTH__ENABLED`
- `AUTH__SESSION_SECRET`
- `AUTH__SESSION_TTL_MS`
- `AUTH__SESSION_COOKIE_NAME`
- `AUTH__SESSION_COOKIE_SECURE`
- `AUTH__RATE_LIMIT__WINDOW_MS`
- `AUTH__RATE_LIMIT__MAX_REQUESTS`
- `AUTH__OIDC__ISSUER_URL`
- `AUTH__OIDC__CLIENT_ID`
- `AUTH__OIDC__CLIENT_SECRET`
- `AUTH__OIDC__REDIRECT_URL`
- `AUTH__OIDC__POST_LOGOUT_REDIRECT_URL`
- `AUTH__OIDC__SCOPES`
- `AUTH__OIDC__REQUIRE_PKCE`
- `AUTH__OIDC__DISCOVERY_TIMEOUT_MS`

When auth is enabled:

- `/health` stays public
- the rest of the API is protected
- OIDC is used so self-hosters can rely on an existing IdP

### Metadata Providers

- `METADATA_PROVIDERS__ENABLED_PROVIDERS`
- `METADATA_PROVIDERS__LOOKUP_TIMEOUT_MS`
- `METADATA_PROVIDERS__DEFAULT_LANGUAGE`

## Migrations And Persistence

Migration scripts:

- `pnpm run migrate:up`
- `pnpm run migrate:down`
- `pnpm run migrate:create <name>`

At runtime, the app also runs pending migrations automatically during boot.

## Scripts

- `pnpm run dev`
  - start the server in watch mode
- `pnpm run start`
  - start the server once
- `pnpm run start:debug`
  - start with the Node inspector
- `pnpm run migrate:up`
  - apply pending migrations
- `pnpm run migrate:down`
  - roll back migrations
- `pnpm run migrate:create <name>`
  - create a migration file
- `pnpm run test:unit`
  - run unit tests
- `pnpm run test:integration`
  - run integration tests
- `pnpm run lint:check`
  - run oxlint
- `pnpm run lint:ts`
  - run `tsc --noEmit`
- `pnpm run fmt:check`
  - verify formatting

## Operations

- Backup and restore guide: [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- Manual smoke checks: [SMOKE_TESTS.md](./SMOKE_TESTS.md)
- Contributor guide: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Architecture

The codebase follows a ports-and-adapters structure with explicit dependency injection.

Top-level layout:

- `src/application`
  - application behavior, entity definitions, and interface contracts
- `src/adapters`
  - infrastructure implementations such as HTTP, auth, config, logging, storage, and persistence
- `src/runtime`
  - runtime-only boot and shutdown behavior
- `src/boot.js`
  - dependency wiring
- `src/index.js`
  - process entrypoint

Important conventions:

- JavaScript source with `.d.ts` contracts
- entity definitions live under `src/application/entities`
- interfaces live under `src/application/interfaces`
- adapters depend on application contracts, not the other way around
- `createX` factories and dependency injection
- do not split ports into separate “driving” and “driven” taxonomies

## Development

For contributor-facing guidance, see [CONTRIBUTING.md](./CONTRIBUTING.md).

If you only want a fast local developer loop:

```bash
cp .env.example .env
pnpm install
pnpm run dev
```

To sanity-check the app manually after changes:

- use [SMOKE_TESTS.md](./SMOKE_TESTS.md)

## License

MIT
