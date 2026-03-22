# LitLocker Server

LitLocker is a self-hosted digital library project inspired by BookLore.

This repository currently contains the server/API. The goal is to build a web-first library manager for EPUB, PDF, and comic formats with a clean reader experience, reliable metadata workflows, and a ports-and-adapters architecture that stays easy to evolve over time.

## Status

This project is still in an early foundation stage.

What exists today:

- Hono-based HTTP server
- Config, logger, and server boot wiring
- Postgres `persistence` adapter using `pg`
- `node-pg-migrate` setup with app-start migration execution
- `/health` endpoint
- Application-level book CRUD functions
- Application-level shelf CRUD and membership functions
- Application-level import job and reading progress functions
- `Book` entity with metadata, authors, tags, series, and cover fields
- Book, shelf, import, and reading-progress route validation
- Basic book routes:
  - `POST /books`
  - `GET /books`
  - `PATCH /books/:id`
  - `GET /books/:id`
- Unit and integration coverage for the current API flow

What is not done yet:

- Richer reader file delivery
- Operational hardening

## Architecture

The codebase follows a ports-and-adapters code org with a strong separation of concerns.

- `src/application`
  - application behavior
  - entity definitions
  - interface contracts
- `src/adapters`
  - infrastructure implementations such as HTTP, config, logging, and data storage
- `src/boot.js`
  - wiring dependencies together

Project conventions:

- JavaScript source with `.d.ts` contracts
- dependency injection through `createX` factories
- entity definitions live under `src/application/entities`
- application contracts live under `src/application/interfaces`
- no `null` values in entities; use concrete defaults such as `""` or `[]`
- no distinction between "driving" and "driven" ports

## Quick Start

### Requirements

- Node.js `24`
- `pnpm` `10`

### Setup

```bash
cp .env.example .env
pnpm install
pnpm run dev
```

The server will start on `http://localhost:3000` by default.

## Environment Variables

Defined in [.env.example](/Users/curamet/development/oss/litlocker/server/.env.example):

- `LOGGER__DEBUG_LOGS_ENABLED`
- `SERVER__HTTP__ADDRESS`
- `SERVER__HTTP__TIMEOUT_MS`
- `SERVER__HTTP__PORT`

## Scripts

- `pnpm run dev` - start the server in watch mode
- `pnpm run start` - start the server once
- `pnpm run migrate:up` - apply pending Postgres migrations
- `pnpm run migrate:down` - roll back the latest Postgres migration
- `pnpm run migrate:create <name>` - create a new Postgres migration file
- `pnpm run test:unit` - run unit tests
- `pnpm run test:integration` - run integration tests
- `pnpm run test` - run all tests
- `pnpm run lint:check` - run lint checks
- `pnpm run lint:ts` - run `tsc --noEmit`
- `pnpm run fmt:check` - check formatting

## Operations

- Backup and restore guide: [BACKUP_RESTORE.md](/Users/curamet/development/oss/litlocker/server/BACKUP_RESTORE.md)

## Current API

### `POST /books`

Creates a book.

Example request body:

```json
{
  "title": "The Left Hand of Darkness",
  "authors": ["Ursula K. Le Guin"],
  "tags": ["science-fiction"],
  "seriesName": "",
  "seriesNumber": ""
}
```

### `GET /books`

Returns all books currently stored.

### `PATCH /books/:id`

Updates an existing book by id.

### `GET /books/:id`

Returns a single book by id or `404` if it does not exist.

## Near-Term Implementation Goals

- [ ] Finish foundation work so the application has stable shared contracts for time, ids, persistence, storage, metadata lookup, and background work.
- [ ] Introduce a real persistence layer so books survive process restarts and the in-memory adapter becomes a development-only implementation.
- [ ] Add shelves as a first-class library organization feature, starting with manual shelves and book membership management.
- [ ] Add library filtering and search so readers can browse by title, author, tag, series, and shelf membership.
- [ ] Build the first import workflow so books can enter the system through upload and move through a visible import lifecycle.
- [ ] Add metadata enrichment and review so imported books can be matched, corrected, and finalized before entering the main library.
- [ ] Add cover extraction and storage workflows so books have stable cover metadata and image references.
- [ ] Introduce reading-progress APIs and the book-file access flow needed to support real reading clients.
- [ ] Build the first reader-facing backend capabilities for EPUB, PDF, and comic reading flows.
- [ ] Add single-admin authentication and route protection so the server is usable as a private self-hosted application.
- [ ] Harden the server for self-hosting with better error handling, upload limits, structured logging, graceful shutdown, and Docker support.
- [ ] Expand the library model with shelves, tags, search, and import workflows into a coherent end-to-end v1 library experience.
- [ ] Prepare the server for ecosystem features such as OPDS and device sync once the core library, import, and progress flows are stable.

## License

MIT
