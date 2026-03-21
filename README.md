# LitLocker Server

LitLocker is a self-hosted digital library project inspired by BookLore.

This repository currently contains the server/API. The goal is to build a web-first library manager for EPUB, PDF, and comic formats with a clean reader experience, reliable metadata workflows, and a ports-and-adapters architecture that stays easy to evolve over time.

## Status

This project is still in an early foundation stage.

What exists today:

- Hono-based HTTP server
- Config, logger, and server boot wiring
- In-memory `data-store` adapter
- Application-level book CRUD functions
- `Book` entity with metadata, authors, tags, series, and cover fields
- Basic book routes:
  - `POST /books`
  - `GET /books`
  - `GET /books/:id`

What is not done yet:

- Request validation
- Persistent storage
- Shelves
- Import pipeline
- Reader and progress sync
- Auth

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
- `pnpm run test:unit` - run unit tests
- `pnpm run test:integration` - run integration tests
- `pnpm run test` - run all tests
- `pnpm run lint:check` - run lint checks
- `pnpm run fmt:check` - check formatting

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

Returns all books currently stored in the configured `data-store`.

### `GET /books/:id`

Returns a single book by id or `404` if it does not exist.

### `GET /hello/:name`

Temporary bootstrap/example route.

## Near-Term Priorities

- add request validation for book routes
- add `PATCH /books/:id`
- add route-level API tests
- introduce shelves and filtering
- start implementation fo the import pipeline

## License

MIT
