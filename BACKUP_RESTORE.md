# Backup and Restore

LitLocker stores data in two places:

- Postgres data in the `litlocker` schema
- local filesystem data under the configured storage paths

To get a complete backup, you need both.

## What To Back Up

Database:

- all tables in the `litlocker` schema
- migration state in the default `public.pgmigrations` table used by `node-pg-migrate`

Filesystem:

- `STORAGE__PATHS__LIBRARY`
- `STORAGE__PATHS__IMPORTS`
- `STORAGE__PATHS__COVERS`

With the default `.env.example`, that means:

- `./data/library`
- `./data/imports`
- `./data/covers`

## Before You Start

For the cleanest backup:

- stop the app, or temporarily block writes while the backup runs
- make sure the target restore environment uses the same storage path layout or an intentionally migrated equivalent
- keep the `.env` values for `DATABASE__*` and `STORAGE__PATHS__*` with the backup metadata

## Create A Database Backup

Use `pg_dump` against the configured database and include both the application schema and the migration history table.

Example:

```bash
PGPASSWORD="$DATABASE__PASSWORD" pg_dump \
  --host="$DATABASE__HOST" \
  --port="$DATABASE__PORT" \
  --username="$DATABASE__USER" \
  --dbname="$DATABASE__DATABASE" \
  --format=custom \
  --file=./backups/litlocker-db.dump \
  --schema=litlocker \
  --table=public.pgmigrations
```

If your shell does not already export those variables, replace them with concrete values.

## Create A Filesystem Backup

Archive the configured storage directories together.

Example:

```bash
tar -czf ./backups/litlocker-files.tar.gz \
  ./data/library \
  ./data/imports \
  ./data/covers
```

The exact paths should match your configured storage roots, not necessarily the defaults.

## Restore The Database

1. Make sure the target database exists.
2. Make sure the `litlocker` schema is not being used by a running app.
3. Restore the database dump.

Example:

```bash
PGPASSWORD="$DATABASE__PASSWORD" pg_restore \
  --host="$DATABASE__HOST" \
  --port="$DATABASE__PORT" \
  --username="$DATABASE__USER" \
  --dbname="$DATABASE__DATABASE" \
  --clean \
  --if-exists \
  ./backups/litlocker-db.dump
```

After restoring, start the app normally. App startup will run pending migrations automatically, so the schema can be brought up to the current version if the backup came from an older release.

## Restore The Filesystem Data

Restore the storage archive into the configured storage paths before users begin reading or importing again.

Example:

```bash
tar -xzf ./backups/litlocker-files.tar.gz
```

If you are restoring onto a new machine or into a container volume:

- recreate the configured storage directories
- extract the archive so the `library`, `imports`, and `covers` paths line up with your `.env`
- make sure the app process has read/write permissions on those directories

## Recommended Restore Order

1. Stop the app.
2. Restore the Postgres dump.
3. Restore the filesystem archive.
4. Confirm the `.env` file points at the restored database and storage paths.
5. Start the app and let startup migrations run.
6. Verify `/health`, then browse books, shelves, imports, and reading progress.

## Operational Notes

- Books, shelves, users, import jobs, and reading progress live in Postgres.
- Uploaded book files and cover assets live on disk.
- A database-only backup is incomplete because book files and covers will be missing.
- A filesystem-only backup is incomplete because metadata, shelves, imports, users, and progress will be missing.
