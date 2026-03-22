import { describe, expect, it } from "vitest";
import { runPersistenceUnitTests } from "../../../application/interfaces/test-runners/persistence.unit.test-runner.js";
import { createPersistencePostgres } from "../../persistence/postgres/index.js";

const schemaName = "litlocker";

const config = {
  database: {
    host: "localhost",
    port: 15_432,
    user: "devdb",
    password: "devpass",
    database: "devdb",
    schema: schemaName,
    sslEnabled: false,
    poolMaxConnections: 5,
    poolIdleTimeoutMs: 5_000,
    connectionTimeoutMs: 5_000,
  },
};

/**
 * @param {Record<string, unknown>} record
 * @returns {Record<string, unknown>}
 */
const cloneRecord = (record) => {
  return structuredClone(record);
};

/**
 * @param {string} schema
 * @returns {{ query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>; end: () => Promise<void> }}
 */
const createPoolDouble = (schema) => {
  const tables = {
    books: new Map(),
    shelves: new Map(),
    users: new Map(),
    importJobs: new Map(),
    readingProgress: new Map(),
  };
  const booksTable = `"${schema}"."books"`;
  const shelvesTable = `"${schema}"."shelves"`;
  const usersTable = `"${schema}"."users"`;
  const importJobsTable = `"${schema}"."import_jobs"`;
  const readingProgressTable = `"${schema}"."reading_progress"`;

  /** @param {unknown[]} params */
  const createBookRow = (params) => {
    return {
      id: String(params[0]),
      title: String(params[1]),
      subtitle: String(params[2]),
      description: String(params[3]),
      language: String(params[4]),
      authors: String(params[5]),
      tags: String(params[6]),
      series_name: String(params[7]),
      series_number: String(params[8]),
      cover: String(params[9]),
      identifiers: String(params[10]),
      file_path: String(params[11]),
      library_status: String(params[12]),
      reading_status: String(params[13]),
    };
  };

  /** @param {unknown[]} params */
  const createShelfRow = (params) => {
    return {
      id: String(params[0]),
      kind: String(params[1]),
      name: String(params[2]),
      description: String(params[3]),
      book_ids: String(params[4]),
    };
  };

  /** @param {unknown[]} params */
  const createUserRow = (params) => {
    return {
      id: String(params[0]),
      auth_issuer: String(params[1]),
      auth_subject: String(params[2]),
      email: String(params[3]),
      email_verified: params[4] === true,
      display_name: String(params[5]),
      avatar_url: String(params[6]),
      role: String(params[7]),
      created_at: String(params[8]),
      updated_at: String(params[9]),
    };
  };

  /** @param {unknown[]} params */
  const createImportJobRow = (params) => {
    return {
      id: String(params[0]),
      status: String(params[1]),
      source: String(params[2]),
      detected_file_type: String(params[3]),
      metadata_candidates: String(params[4]),
      selected_metadata_candidate_index: Number(params[5]),
      duplicate_detection: String(params[6]),
      error: String(params[7]),
    };
  };

  /** @param {unknown[]} params */
  const createReadingProgressRow = (params) => {
    return {
      id: String(params[0]),
      book_id: String(params[1]),
      user_id: String(params[2]),
      format: String(params[3]),
      locator: String(params[4]),
      percentage: String(params[5]),
      created_at: String(params[6]),
      updated_at: String(params[7]),
    };
  };

  return {
    query: async (sql, params = []) => {
      if (sql === "SELECT 1") {
        return {
          rows: [{ value: 1 }],
          rowCount: 1,
        };
      }

      if (sql.includes(`FROM ${readingProgressTable}`) && sql.includes("LEFT JOIN")) {
        let count = 0;

        for (const row of tables.readingProgress.values()) {
          const hasBook = tables.books.has(String(row.book_id));
          const hasUser = tables.users.has(String(row.user_id));

          if (!hasBook || !hasUser) {
            count += 1;
          }
        }

        return {
          rows: [{ count }],
          rowCount: 1,
        };
      }

      if (sql.includes(`FROM ${shelvesTable}`) && sql.includes("jsonb_array_elements_text")) {
        let count = 0;

        for (const row of tables.shelves.values()) {
          const bookIds = JSON.parse(String(row.book_ids));

          for (const bookId of bookIds) {
            if (!tables.books.has(String(bookId))) {
              count += 1;
            }
          }
        }

        return {
          rows: [{ count }],
          rowCount: 1,
        };
      }

      if (sql.includes(`INSERT INTO ${booksTable}`)) {
        const row = createBookRow(params);
        tables.books.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`UPDATE ${booksTable}`)) {
        const row = createBookRow(params);
        tables.books.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`SELECT * FROM ${booksTable} WHERE id = $1`)) {
        const row = tables.books.get(String(params[0]));

        return {
          rows: row ? [cloneRecord(row)] : [],
          rowCount: row ? 1 : 0,
        };
      }

      if (sql.includes(`SELECT * FROM ${booksTable} ORDER BY title ASC, id ASC`)) {
        const rows = Array.from(tables.books.values()).sort((left, right) => {
          return `${left.title}:${left.id}`.localeCompare(`${right.title}:${right.id}`);
        });

        return {
          rows: rows.map(cloneRecord),
          rowCount: rows.length,
        };
      }

      if (sql.includes(`FROM ${booksTable}`) && sql.includes("title ILIKE $1")) {
        const query = String(params[0]).replaceAll("%", "").toLocaleLowerCase();
        const rows = Array.from(tables.books.values()).filter((row) => {
          const searchableValues = [
            row.title,
            row.subtitle,
            row.description,
            row.language,
            row.authors,
            row.tags,
            row.series_name,
            row.series_number,
            row.identifiers,
          ];

          return searchableValues.some((value) =>
            String(value).toLocaleLowerCase().includes(query),
          );
        });

        rows.sort((left, right) =>
          `${left.title}:${left.id}`.localeCompare(`${right.title}:${right.id}`),
        );

        return {
          rows: rows.map(cloneRecord),
          rowCount: rows.length,
        };
      }

      if (sql.includes(`INSERT INTO ${shelvesTable}`)) {
        const row = createShelfRow(params);
        tables.shelves.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`UPDATE ${shelvesTable}`)) {
        const row = createShelfRow(params);
        tables.shelves.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`SELECT * FROM ${shelvesTable} WHERE id = $1`)) {
        const row = tables.shelves.get(String(params[0]));

        return {
          rows: row ? [cloneRecord(row)] : [],
          rowCount: row ? 1 : 0,
        };
      }

      if (sql.includes(`SELECT * FROM ${shelvesTable} ORDER BY name ASC, id ASC`)) {
        const rows = Array.from(tables.shelves.values()).sort((left, right) => {
          return `${left.name}:${left.id}`.localeCompare(`${right.name}:${right.id}`);
        });

        return {
          rows: rows.map(cloneRecord),
          rowCount: rows.length,
        };
      }

      if (sql.includes(`DELETE FROM ${shelvesTable} WHERE id = $1`)) {
        const deleted = tables.shelves.delete(String(params[0]));

        return {
          rows: [],
          rowCount: deleted ? 1 : 0,
        };
      }

      if (sql.includes(`INSERT INTO ${usersTable}`)) {
        const row = createUserRow(params);
        tables.users.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`UPDATE ${usersTable}`)) {
        const row = createUserRow(params);
        tables.users.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`SELECT * FROM ${usersTable} WHERE id = $1`)) {
        const row = tables.users.get(String(params[0]));

        return {
          rows: row ? [cloneRecord(row)] : [],
          rowCount: row ? 1 : 0,
        };
      }

      if (sql.includes(`SELECT * FROM ${usersTable} ORDER BY display_name ASC, id ASC`)) {
        const rows = Array.from(tables.users.values()).sort((left, right) => {
          return `${left.display_name}:${left.id}`.localeCompare(
            `${right.display_name}:${right.id}`,
          );
        });

        return {
          rows: rows.map(cloneRecord),
          rowCount: rows.length,
        };
      }

      if (
        sql.includes(`SELECT * FROM ${usersTable} WHERE auth_issuer = $1 AND auth_subject = $2`)
      ) {
        const row =
          Array.from(tables.users.values()).find(
            (user) =>
              user.auth_issuer === String(params[0]) && user.auth_subject === String(params[1]),
          ) ?? null;

        return {
          rows: row ? [cloneRecord(row)] : [],
          rowCount: row ? 1 : 0,
        };
      }

      if (sql.includes(`INSERT INTO ${importJobsTable}`)) {
        const row = createImportJobRow(params);
        tables.importJobs.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`UPDATE ${importJobsTable}`)) {
        const row = createImportJobRow(params);
        tables.importJobs.set(row.id, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (sql.includes(`SELECT * FROM ${importJobsTable} WHERE id = $1`)) {
        const row = tables.importJobs.get(String(params[0]));

        return {
          rows: row ? [cloneRecord(row)] : [],
          rowCount: row ? 1 : 0,
        };
      }

      if (sql.includes(`SELECT * FROM ${importJobsTable} ORDER BY id ASC`)) {
        const rows = Array.from(tables.importJobs.values()).sort((left, right) => {
          return String(left.id).localeCompare(String(right.id));
        });

        return {
          rows: rows.map(cloneRecord),
          rowCount: rows.length,
        };
      }

      if (sql.includes(`INSERT INTO ${readingProgressTable}`)) {
        const row = createReadingProgressRow(params);
        tables.readingProgress.set(`${row.book_id}:${row.user_id}`, row);

        return {
          rows: [cloneRecord(row)],
          rowCount: 1,
        };
      }

      if (
        sql.includes(`SELECT * FROM ${readingProgressTable} WHERE book_id = $1 AND user_id = $2`)
      ) {
        const row = tables.readingProgress.get(`${params[0]}:${params[1]}`);

        return {
          rows: row ? [cloneRecord(row)] : [],
          rowCount: row ? 1 : 0,
        };
      }

      throw new Error(`Unhandled SQL in pool double: ${sql}`);
    },
    end: async () => {},
  };
};

runPersistenceUnitTests(() => {
  return createPersistencePostgres({
    config,
    pool: createPoolDouble(schemaName),
  });
});

describe("postgres persistence health checks", () => {
  it("should report orphaned references when reading progress points to missing records", async () => {
    const persistence = createPersistencePostgres({
      config,
      pool: createPoolDouble(schemaName),
    });

    await persistence.readingProgress.save({
      record: {
        id: "progress-1",
        bookId: "missing-book",
        userId: "missing-user",
        format: "epub",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
      },
    });

    await expect(persistence.checkHealth()).resolves.toEqual({
      success: false,
      error: {
        code: "postgres_integrity_error",
        message: "Postgres persistence contains orphaned references",
        details: {
          orphanedReadingProgressCount: 1,
          orphanedShelfBookReferenceCount: 0,
        },
      },
    });
  });

  it("should report orphaned references when a shelf contains missing books", async () => {
    const persistence = createPersistencePostgres({
      config,
      pool: createPoolDouble(schemaName),
    });

    await persistence.shelves.create({
      record: {
        id: "shelf-1",
        kind: "manual",
        name: "Broken Shelf",
        description: "",
        bookIds: ["missing-book"],
      },
    });

    await expect(persistence.checkHealth()).resolves.toEqual({
      success: false,
      error: {
        code: "postgres_integrity_error",
        message: "Postgres persistence contains orphaned references",
        details: {
          orphanedReadingProgressCount: 0,
          orphanedShelfBookReferenceCount: 1,
        },
      },
    });
  });
});
