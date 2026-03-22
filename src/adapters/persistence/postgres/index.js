/**
 * @import { Config } from "../../../application/interfaces/config.js";
 * @import { Book } from "../../../application/entities/book.js";
 * @import { ImportJob } from "../../../application/entities/import-job.js";
 * @import { ReadingProgress } from "../../../application/entities/reading-progress.js";
 * @import { User } from "../../../application/entities/user.js";
 * @import { CreatePersistence, Persistence } from "../../../application/interfaces/persistence.js";
 * @import { HealthStatus, Result, SuccessResult } from "../../../application/interfaces/result.js";
 * @import { Shelf } from "../../../application/interfaces/shelf.js";
 */

import pg from "pg";

const { Pool } = pg;

/**
 * @typedef {{
 *   query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
 *   end: () => Promise<void>;
 * }} QueryablePool
 */

/**
 * @param {Record<string, unknown>} [details]
 * @returns {SuccessResult<HealthStatus>}
 */
const createHealthSuccessResult = (details = {}) => {
  return {
    success: true,
    data: {
      status: "ok",
      details,
    },
  };
};

/**
 * @param {Record<string, unknown>} details
 * @returns {Result<HealthStatus>}
 */
const createHealthFailureResult = (details) => {
  return {
    success: false,
    error: {
      code: "postgres_unavailable",
      message: "Postgres persistence is unavailable",
      details,
    },
  };
};

/**
 * @param {Record<string, unknown>} details
 * @returns {Result<HealthStatus>}
 */
const createIntegrityFailureResult = (details) => {
  return {
    success: false,
    error: {
      code: "postgres_integrity_error",
      message: "Postgres persistence contains orphaned references",
      details,
    },
  };
};

/**
 * @param {string} identifier
 * @returns {string}
 */
const quoteIdentifier = (identifier) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
};

/**
 * @param {string} schema
 * @param {string} tableName
 * @returns {string}
 */
const createQualifiedTableName = (schema, tableName) => {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(tableName)}`;
};

/**
 * @param {unknown} value
 * @returns {string}
 */
const serializeJson = (value) => {
  return JSON.stringify(value);
};

/**
 * @template TValue
 * @param {unknown} value
 * @param {TValue} fallbackValue
 * @returns {TValue}
 */
const parseJson = (value, fallbackValue) => {
  if (value === null || value === undefined) {
    return fallbackValue;
  }

  if (typeof value !== "string") {
    return /** @type {TValue} */ (value);
  }

  try {
    return /** @type {TValue} */ (JSON.parse(value));
  } catch {
    return fallbackValue;
  }
};

/**
 * @param {Record<string, unknown>} row
 * @returns {Book}
 */
const mapBookRow = (row) => {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: String(row.subtitle),
    description: String(row.description),
    language: String(row.language),
    authors: parseJson(row.authors, []),
    tags: parseJson(row.tags, []),
    seriesName: String(row.series_name),
    seriesNumber: String(row.series_number),
    cover: parseJson(row.cover, {
      sourcePath: "",
      thumbnailPath: "",
      mimeType: "",
      dominantColor: "",
    }),
    identifiers: parseJson(row.identifiers, {
      isbn10: "",
      isbn13: "",
      asin: "",
      goodreadsId: "",
      googleBooksId: "",
    }),
    filePath: String(row.file_path),
    libraryStatus: /** @type {Book["libraryStatus"]} */ (row.library_status),
    readingStatus: /** @type {Book["readingStatus"]} */ (row.reading_status),
  };
};

/**
 * @param {Record<string, unknown>} row
 * @returns {Shelf}
 */
const mapShelfRow = (row) => {
  return {
    id: String(row.id),
    kind: /** @type {Shelf["kind"]} */ (row.kind),
    name: String(row.name),
    description: String(row.description),
    bookIds: parseJson(row.book_ids, []),
  };
};

/**
 * @param {Record<string, unknown>} row
 * @returns {User}
 */
const mapUserRow = (row) => {
  return {
    id: String(row.id),
    authIssuer: String(row.auth_issuer),
    authSubject: String(row.auth_subject),
    email: String(row.email),
    emailVerified: row.email_verified === true,
    displayName: String(row.display_name),
    avatarUrl: String(row.avatar_url),
    role: /** @type {User["role"]} */ (row.role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
};

/**
 * @param {Record<string, unknown>} row
 * @returns {ImportJob}
 */
const mapImportJobRow = (row) => {
  return {
    id: String(row.id),
    status: /** @type {ImportJob["status"]} */ (row.status),
    source: parseJson(row.source, {
      kind: "upload",
      path: "",
      originalFileName: "",
    }),
    detectedFileType: String(row.detected_file_type),
    metadataCandidates: parseJson(row.metadata_candidates, []),
    selectedMetadataCandidateIndex: Number(row.selected_metadata_candidate_index),
    duplicateDetection: parseJson(row.duplicate_detection, {
      fileHash: "",
      duplicateImportJobIds: [],
      duplicateBookIds: [],
    }),
    error: parseJson(row.error, {
      code: "",
      message: "",
      details: "",
    }),
  };
};

/**
 * @param {Record<string, unknown>} row
 * @returns {ReadingProgress}
 */
const mapReadingProgressRow = (row) => {
  return {
    id: String(row.id),
    bookId: String(row.book_id),
    userId: String(row.user_id),
    format: /** @type {ReadingProgress["format"]} */ (row.format),
    locator: String(row.locator),
    percentage: String(row.percentage),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
};

/**
 * @param {object} params
 * @param {QueryablePool} params.pool
 * @param {string} params.schema
 * @returns {Persistence}
 */
const createPersistenceFromPool = ({ pool, schema }) => {
  const booksTableName = createQualifiedTableName(schema, "books");
  const shelvesTableName = createQualifiedTableName(schema, "shelves");
  const usersTableName = createQualifiedTableName(schema, "users");
  const importJobsTableName = createQualifiedTableName(schema, "import_jobs");
  const readingProgressTableName = createQualifiedTableName(schema, "reading_progress");
  const orphanedReadingProgressQuery = `
    SELECT COUNT(*) AS count
    FROM ${readingProgressTableName} AS reading_progress
    LEFT JOIN ${booksTableName} AS books
      ON books.id = reading_progress.book_id
    LEFT JOIN ${usersTableName} AS users
      ON users.id = reading_progress.user_id
    WHERE books.id IS NULL OR users.id IS NULL
  `;
  const orphanedShelfBookReferenceQuery = `
    SELECT COUNT(*) AS count
    FROM ${shelvesTableName} AS shelves
    CROSS JOIN LATERAL jsonb_array_elements_text(shelves.book_ids) AS shelf_book(book_id)
    LEFT JOIN ${booksTableName} AS books
      ON books.id = shelf_book.book_id
    WHERE books.id IS NULL
  `;

  const checkHealth = async () => {
    try {
      await pool.query("SELECT 1");
      const orphanedReadingProgressResult = await pool.query(orphanedReadingProgressQuery);
      const orphanedShelfBookReferenceResult = await pool.query(orphanedShelfBookReferenceQuery);
      const orphanedReadingProgressCount = Number(
        orphanedReadingProgressResult.rows[0]?.count ?? 0,
      );
      const orphanedShelfBookReferenceCount = Number(
        orphanedShelfBookReferenceResult.rows[0]?.count ?? 0,
      );

      if (orphanedReadingProgressCount > 0 || orphanedShelfBookReferenceCount > 0) {
        return createIntegrityFailureResult({
          orphanedReadingProgressCount,
          orphanedShelfBookReferenceCount,
        });
      }

      return createHealthSuccessResult({
        orphanedReadingProgressCount,
        orphanedShelfBookReferenceCount,
      });
    } catch (error) {
      return createHealthFailureResult({
        cause: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return {
    books: {
      create: async ({ record }) => {
        const result = await pool.query(
          `
            INSERT INTO ${booksTableName} (
              id,
              title,
              subtitle,
              description,
              language,
              authors,
              tags,
              series_name,
              series_number,
              cover,
              identifiers,
              file_path,
              library_status,
              reading_status
            )
            VALUES (
              $1, $2, $3, $4, $5,
              $6::jsonb, $7::jsonb, $8, $9,
              $10::jsonb, $11::jsonb, $12, $13, $14
            )
            RETURNING *
          `,
          [
            record.id,
            record.title,
            record.subtitle,
            record.description,
            record.language,
            serializeJson(record.authors),
            serializeJson(record.tags),
            record.seriesName,
            record.seriesNumber,
            serializeJson(record.cover),
            serializeJson(record.identifiers),
            record.filePath,
            record.libraryStatus,
            record.readingStatus,
          ],
        );

        return mapBookRow(result.rows[0]);
      },
      update: async ({ id, updates }) => {
        const currentResult = await pool.query(`SELECT * FROM ${booksTableName} WHERE id = $1`, [
          id,
        ]);

        if (!currentResult.rows[0]) {
          return null;
        }

        const currentRecord = mapBookRow(currentResult.rows[0]);
        const result = await pool.query(
          `
            UPDATE ${booksTableName}
            SET
              title = $2,
              subtitle = $3,
              description = $4,
              language = $5,
              authors = $6::jsonb,
              tags = $7::jsonb,
              series_name = $8,
              series_number = $9,
              cover = $10::jsonb,
              identifiers = $11::jsonb,
              file_path = $12,
              library_status = $13,
              reading_status = $14
            WHERE id = $1
            RETURNING *
          `,
          [
            id,
            updates.title ?? currentRecord.title,
            updates.subtitle ?? currentRecord.subtitle,
            updates.description ?? currentRecord.description,
            updates.language ?? currentRecord.language,
            serializeJson(updates.authors ?? currentRecord.authors),
            serializeJson(updates.tags ?? currentRecord.tags),
            updates.seriesName ?? currentRecord.seriesName,
            updates.seriesNumber ?? currentRecord.seriesNumber,
            serializeJson(updates.cover ?? currentRecord.cover),
            serializeJson(updates.identifiers ?? currentRecord.identifiers),
            updates.filePath ?? currentRecord.filePath,
            updates.libraryStatus ?? currentRecord.libraryStatus,
            updates.readingStatus ?? currentRecord.readingStatus,
          ],
        );

        return mapBookRow(result.rows[0]);
      },
      list: async () => {
        const result = await pool.query(
          `SELECT * FROM ${booksTableName} ORDER BY title ASC, id ASC`,
        );

        return result.rows.map(mapBookRow);
      },
      search: async ({ query }) => {
        const result = await pool.query(
          `
            SELECT *
            FROM ${booksTableName}
            WHERE
              title ILIKE $1 OR
              subtitle ILIKE $1 OR
              description ILIKE $1 OR
              language ILIKE $1 OR
              authors::text ILIKE $1 OR
              tags::text ILIKE $1 OR
              series_name ILIKE $1 OR
              series_number ILIKE $1 OR
              identifiers::text ILIKE $1
            ORDER BY title ASC, id ASC
          `,
          [`%${query}%`],
        );

        return result.rows.map(mapBookRow);
      },
      get: async ({ id }) => {
        const result = await pool.query(`SELECT * FROM ${booksTableName} WHERE id = $1`, [id]);

        return result.rows[0] ? mapBookRow(result.rows[0]) : null;
      },
    },
    shelves: {
      create: async ({ record }) => {
        const result = await pool.query(
          `
            INSERT INTO ${shelvesTableName} (id, kind, name, description, book_ids)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            RETURNING *
          `,
          [record.id, record.kind, record.name, record.description, serializeJson(record.bookIds)],
        );

        return mapShelfRow(result.rows[0]);
      },
      update: async ({ id, updates }) => {
        const currentResult = await pool.query(`SELECT * FROM ${shelvesTableName} WHERE id = $1`, [
          id,
        ]);

        if (!currentResult.rows[0]) {
          return null;
        }

        const currentRecord = mapShelfRow(currentResult.rows[0]);
        const result = await pool.query(
          `
            UPDATE ${shelvesTableName}
            SET
              kind = $2,
              name = $3,
              description = $4,
              book_ids = $5::jsonb
            WHERE id = $1
            RETURNING *
          `,
          [
            id,
            updates.kind ?? currentRecord.kind,
            updates.name ?? currentRecord.name,
            updates.description ?? currentRecord.description,
            serializeJson(updates.bookIds ?? currentRecord.bookIds),
          ],
        );

        return mapShelfRow(result.rows[0]);
      },
      list: async () => {
        const result = await pool.query(
          `SELECT * FROM ${shelvesTableName} ORDER BY name ASC, id ASC`,
        );

        return result.rows.map(mapShelfRow);
      },
      get: async ({ id }) => {
        const result = await pool.query(`SELECT * FROM ${shelvesTableName} WHERE id = $1`, [id]);

        return result.rows[0] ? mapShelfRow(result.rows[0]) : null;
      },
      delete: async ({ id }) => {
        const result = await pool.query(`DELETE FROM ${shelvesTableName} WHERE id = $1`, [id]);

        return {
          success: (result.rowCount ?? 0) > 0,
        };
      },
    },
    users: {
      create: async ({ record }) => {
        const result = await pool.query(
          `
            INSERT INTO ${usersTableName} (
              id,
              auth_issuer,
              auth_subject,
              email,
              email_verified,
              display_name,
              avatar_url,
              role,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
          `,
          [
            record.id,
            record.authIssuer,
            record.authSubject,
            record.email,
            record.emailVerified,
            record.displayName,
            record.avatarUrl,
            record.role,
            record.createdAt,
            record.updatedAt,
          ],
        );

        return mapUserRow(result.rows[0]);
      },
      update: async ({ id, updates }) => {
        const currentResult = await pool.query(`SELECT * FROM ${usersTableName} WHERE id = $1`, [
          id,
        ]);

        if (!currentResult.rows[0]) {
          return null;
        }

        const currentRecord = mapUserRow(currentResult.rows[0]);
        const result = await pool.query(
          `
            UPDATE ${usersTableName}
            SET
              auth_issuer = $2,
              auth_subject = $3,
              email = $4,
              email_verified = $5,
              display_name = $6,
              avatar_url = $7,
              role = $8,
              created_at = $9,
              updated_at = $10
            WHERE id = $1
            RETURNING *
          `,
          [
            id,
            updates.authIssuer ?? currentRecord.authIssuer,
            updates.authSubject ?? currentRecord.authSubject,
            updates.email ?? currentRecord.email,
            updates.emailVerified ?? currentRecord.emailVerified,
            updates.displayName ?? currentRecord.displayName,
            updates.avatarUrl ?? currentRecord.avatarUrl,
            updates.role ?? currentRecord.role,
            updates.createdAt ?? currentRecord.createdAt,
            updates.updatedAt ?? currentRecord.updatedAt,
          ],
        );

        return mapUserRow(result.rows[0]);
      },
      list: async () => {
        const result = await pool.query(
          `SELECT * FROM ${usersTableName} ORDER BY display_name ASC, id ASC`,
        );

        return result.rows.map(mapUserRow);
      },
      get: async ({ id }) => {
        const result = await pool.query(`SELECT * FROM ${usersTableName} WHERE id = $1`, [id]);

        return result.rows[0] ? mapUserRow(result.rows[0]) : null;
      },
      getByAuthIdentity: async ({ authIssuer, authSubject }) => {
        const result = await pool.query(
          `SELECT * FROM ${usersTableName} WHERE auth_issuer = $1 AND auth_subject = $2`,
          [authIssuer, authSubject],
        );

        return result.rows[0] ? mapUserRow(result.rows[0]) : null;
      },
    },
    importJobs: {
      create: async ({ record }) => {
        const result = await pool.query(
          `
            INSERT INTO ${importJobsTableName} (
              id,
              status,
              source,
              detected_file_type,
              metadata_candidates,
              selected_metadata_candidate_index,
              duplicate_detection,
              error
            )
            VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6, $7::jsonb, $8::jsonb)
            RETURNING *
          `,
          [
            record.id,
            record.status,
            serializeJson(record.source),
            record.detectedFileType,
            serializeJson(record.metadataCandidates),
            record.selectedMetadataCandidateIndex,
            serializeJson(record.duplicateDetection),
            serializeJson(record.error),
          ],
        );

        return mapImportJobRow(result.rows[0]);
      },
      update: async ({ id, updates }) => {
        const currentResult = await pool.query(
          `SELECT * FROM ${importJobsTableName} WHERE id = $1`,
          [id],
        );

        if (!currentResult.rows[0]) {
          return null;
        }

        const currentRecord = mapImportJobRow(currentResult.rows[0]);
        const result = await pool.query(
          `
            UPDATE ${importJobsTableName}
            SET
              status = $2,
              source = $3::jsonb,
              detected_file_type = $4,
              metadata_candidates = $5::jsonb,
              selected_metadata_candidate_index = $6,
              duplicate_detection = $7::jsonb,
              error = $8::jsonb
            WHERE id = $1
            RETURNING *
          `,
          [
            id,
            updates.status ?? currentRecord.status,
            serializeJson(updates.source ?? currentRecord.source),
            updates.detectedFileType ?? currentRecord.detectedFileType,
            serializeJson(updates.metadataCandidates ?? currentRecord.metadataCandidates),
            updates.selectedMetadataCandidateIndex ?? currentRecord.selectedMetadataCandidateIndex,
            serializeJson(updates.duplicateDetection ?? currentRecord.duplicateDetection),
            serializeJson(updates.error ?? currentRecord.error),
          ],
        );

        return mapImportJobRow(result.rows[0]);
      },
      list: async () => {
        const result = await pool.query(`SELECT * FROM ${importJobsTableName} ORDER BY id ASC`);

        return result.rows.map(mapImportJobRow);
      },
      get: async ({ id }) => {
        const result = await pool.query(`SELECT * FROM ${importJobsTableName} WHERE id = $1`, [id]);

        return result.rows[0] ? mapImportJobRow(result.rows[0]) : null;
      },
    },
    readingProgress: {
      save: async ({ record }) => {
        const result = await pool.query(
          `
            INSERT INTO ${readingProgressTableName} (
              id,
              book_id,
              user_id,
              format,
              locator,
              percentage,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (book_id, user_id)
            DO UPDATE SET
              id = EXCLUDED.id,
              format = EXCLUDED.format,
              locator = EXCLUDED.locator,
              percentage = EXCLUDED.percentage,
              created_at = EXCLUDED.created_at,
              updated_at = EXCLUDED.updated_at
            RETURNING *
          `,
          [
            record.id,
            record.bookId,
            record.userId,
            record.format,
            record.locator,
            record.percentage,
            record.createdAt,
            record.updatedAt,
          ],
        );

        return mapReadingProgressRow(result.rows[0]);
      },
      get: async ({ bookId, userId }) => {
        const result = await pool.query(
          `SELECT * FROM ${readingProgressTableName} WHERE book_id = $1 AND user_id = $2`,
          [bookId, userId],
        );

        return result.rows[0] ? mapReadingProgressRow(result.rows[0]) : null;
      },
    },
    checkHealth,
  };
};

/**
 * @param {object} params
 * @param {Pick<Config, "database">} params.config
 * @param {QueryablePool} [params.pool]
 * @returns {Persistence & { pool: QueryablePool }}
 */
const createPersistencePostgres = ({ config, pool }) => {
  const postgresPool =
    pool ??
    new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      ssl: config.database.sslEnabled ? { rejectUnauthorized: false } : false,
      max: config.database.poolMaxConnections,
      idleTimeoutMillis: config.database.poolIdleTimeoutMs,
      connectionTimeoutMillis: config.database.connectionTimeoutMs,
    });
  const persistence = createPersistenceFromPool({
    pool: postgresPool,
    schema: config.database.schema,
  });

  return {
    ...persistence,
    pool: postgresPool,
  };
};

export { createPersistencePostgres };
