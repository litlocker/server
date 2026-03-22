# Contributing

Thanks for considering a contribution to LitLocker Server.

This project is intentionally structured to stay easy to reason about as it grows. The most helpful contributions are the ones that preserve that clarity while moving one slice of behavior forward at a time.

## Usage of AI

Contributors are free to use their AI tooling of choice, provided they do not use it to generate "slop" code.

In the end, the person opening the PR is the one I expect a good understanding of the changes from, not from the AI.

## Before You Start

Make sure you can run the project locally:

```bash
cp .env.example .env
pnpm install
pnpm run start
```

For Docker-based setup:

```bash
cp .env.example .env
docker compose up --build
```

Useful verification commands:

```bash
pnpm run test:unit
NODE_ENV=test DATABASE__ALLOW_TEST_RESET=true pnpm run test:integration # DATABASE__ALLOW_TEST_RESET will cause data loss in non-test environments, so it is required for integration tests but should be used with caution otherwise
pnpm run fmt:check
pnpm run lint:check
pnpm run lint:ts
```

## How The Code Is Organized

### `src/application`

This is the core of the system.

It contains:

- entities under `src/application/entities`
- interface contracts under `src/application/interfaces`
- application behavior in `src/application/index.js`

The application layer should express domain behavior and orchestration. It should not know about Hono, Postgres, Docker, or any other concrete infrastructure details.

### `src/adapters`

This is where infrastructure lives.

Examples:

- HTTP in `src/adapters/server/http-hono`
- Postgres persistence in `src/adapters/persistence/postgres`
- local file storage in `src/adapters/file-storage/local-filesystem`
- OIDC auth in `src/adapters/auth/oidc`
- static env config in `src/adapters/config/static-env`

Adapters implement the contracts declared in `src/application/interfaces`.

### `src/runtime`

This is for runtime-only process behavior like shutdown coordination.

### `src/boot.js`

This file wires together concrete adapters and the application.

If you add a new adapter, it usually should not be reachable until:

1. the interface exists
2. the adapter exists
3. the boot wiring is updated

## Project Rules

These are not suggestions. Please follow them when contributing.

### General

- Keep the ports-and-adapters structure already in the repository.
- Do not introduce a separate “driving” vs “driven” port taxonomy as defined in the original pattern.
- Prefer small, atomic changes over broad rewrites.
- Use `createX` factories and explicit dependency injection.

### Language And Types

- Source files are plain JavaScript.
- Contracts live in `.d.ts` files.
- If you add a new seam, define or extend the contract first.

### Entities

- Entity definitions belong in `src/application/entities`.
- Do not use `null` in entities.
- Prefer concrete defaults such as `""`, `[]`, and fully shaped empty objects.

### Interfaces And Health Checks

- Runtime-facing interfaces should expose `checkHealth`.
- Health checks belong on the root interface object, not every nested subsection unless that structure truly needs it.

### Persistence

The persistence layer has explicit rules:

- use `pg` for executing queries
- do not use an ORM, since I prefer the control and clarity of handwritten SQL
- do not use database-native foreign keys. the database is a means of storing data, and just that. Application-level integrity checks are a better fit for this project and allow for more flexible data modeling.
- use `node-pg-migrate` for writing postgres migrations
- keep application-level integrity checks where needed
- keep everything inside the `litlocker` schema to keep the data isolated from any other data in the database and to make it clear which tables belong to this application.

### Auth

- `/health` is the only public route
- all other API routes are expected to be protected when auth is enabled
- auth is designed around OIDC so self-hosters can use an existing IdP

## How To Add New Behavior

The preferred order is:

1. define or extend the application contract
2. add or update the entity shape if needed
3. implement application behavior
4. implement or update the adapter
5. wire it in through `boot`
6. add or update tests at the appropriate seam

When in doubt, start from the application layer and work outward.

## Testing Style

The repository already has a testing pattern. Follow it instead of inventing a new one.

- application behavior is tested in `src/application/__tests__`
- reusable contract tests live in `src/application/interfaces/test-runners`
- adapter-specific tests live under `src/adapters/__tests__`

Guidelines:

- if you add a new adapter for an existing interface, prefer using or extending the interface test runner
- if you add HTTP behavior, add route-focused adapter tests
- if you add persistence behavior, cover both contract behavior and integration behavior when appropriate

## Documentation Expectations

If you change self-hosting behavior, also consider whether you need to update:

- [README.md](./README.md)
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- [SMOKE_TESTS.md](./SMOKE_TESTS.md)

## Pull Request Guidance

Good contributions bias to make the PR easy for the reviewer.

- move one feature or one seam forward
- preserve the current code organization
- include the right level of tests
- avoid speculative abstractions unless they are clearly needed now
- update docs when self-hosting or contributor behavior changes
- commits are atomic and focused on one thing, with clear messages. a 5k LOC PR with 3 commits is more often than not a sign that the change should be split into smaller pieces. split tests into their own commit if the actual implementation is big. reviews are easier this way.
- PR descriptions should describe the high-level changes, and not a deep dive into the changes.
