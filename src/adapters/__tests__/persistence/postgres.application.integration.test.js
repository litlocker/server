import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApplication } from "../../../application/index.js";
import { createClockSystem } from "../../clock/system/index.js";
import { createConfigStaticEnv } from "../../config/static-env/index.js";
import { createFileStorageLocalFilesystem } from "../../file-storage/local-filesystem/index.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";
import { createLoggerPino } from "../../logger/pino/index.js";
import { createMetadataProviderStatic } from "../../metadata-provider/static/index.js";
import { createPersistencePostgres } from "../../persistence/postgres/index.js";
import { runPendingPostgresMigrations } from "../../persistence/postgres/migrations/index.js";

process.loadEnvFile(".env");

const assertDestructivePostgresTestRun = () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Refusing to run postgres integration tests unless NODE_ENV is 'test'.");
  }

  if (process.env.DATABASE__ALLOW_TEST_RESET !== "true") {
    throw new Error(
      "Refusing to reset postgres tables unless DATABASE__ALLOW_TEST_RESET is 'true'.",
    );
  }
};

describe("postgres-backed application integration", () => {
  const testRootPath = mkdtempSync(join(tmpdir(), "litlocker-postgres-integration-"));
  const baseConfig = createConfigStaticEnv();
  const schemaName = "litlocker";
  const config = {
    ...baseConfig,
    logger: {
      ...baseConfig.logger,
      defaultMetadata: { serviceName: "test" },
    },
    storage: {
      paths: {
        library: join(testRootPath, "library"),
        imports: join(testRootPath, "imports"),
        covers: join(testRootPath, "covers"),
      },
    },
    database: {
      ...baseConfig.database,
      schema: schemaName,
    },
  };
  const logger = createLoggerPino({ config: config.logger });
  const persistence = createPersistencePostgres({ config });

  const resetPersistenceTables = async () => {
    await persistence.pool.query(`
      TRUNCATE TABLE
        "${schemaName}"."reading_progress",
        "${schemaName}"."import_jobs",
        "${schemaName}"."shelves",
        "${schemaName}"."users",
        "${schemaName}"."books"
    `);
  };

  const createTestApplication = () => {
    return createApplication({
      clock: createClockSystem(),
      config,
      fileStorage: createFileStorageLocalFilesystem({ config }),
      metadataProvider: createMetadataProviderStatic(),
      persistence,
      idGenerator: createIdGeneratorSystem(),
      logger,
    });
  };

  beforeAll(async () => {
    assertDestructivePostgresTestRun();
    await runPendingPostgresMigrations({ config, logger });
  });

  beforeEach(async () => {
    rmSync(testRootPath, { recursive: true, force: true });
    await resetPersistenceTables();
  });

  afterAll(async () => {
    await resetPersistenceTables();
    await persistence.pool.end();
    rmSync(testRootPath, { recursive: true, force: true });
  });

  it("should persist book and shelf CRUD through the postgres adapter", async () => {
    const application = createTestApplication();
    const createdBook = await application.createBook({
      book: {
        title: "The Left Hand of Darkness",
        authors: ["Ursula K. Le Guin"],
        tags: ["science-fiction"],
      },
    });
    const updatedBook = await application.updateBook({
      id: createdBook.id,
      updates: {
        description: "A landmark science fiction novel",
        seriesName: "Hainish Cycle",
      },
    });
    const createdShelf = await application.createShelf({
      shelf: {
        name: "Favorites",
      },
    });
    const shelfWithBook = await application.addBookToShelf({
      shelfId: createdShelf.id,
      bookId: createdBook.id,
    });
    const updatedShelf = await application.updateShelf({
      id: createdShelf.id,
      updates: {
        description: "Frequently revisited books",
      },
    });

    expect(updatedBook).toEqual({
      ...createdBook,
      description: "A landmark science fiction novel",
      seriesName: "Hainish Cycle",
    });
    expect(shelfWithBook).toEqual({
      ...createdShelf,
      bookIds: [createdBook.id],
    });
    expect(updatedShelf).toEqual({
      ...createdShelf,
      bookIds: [createdBook.id],
      description: "Frequently revisited books",
    });

    const persistedApplication = createTestApplication();

    await expect(
      persistedApplication.getBook({
        id: createdBook.id,
      }),
    ).resolves.toEqual(updatedBook);
    await expect(
      persistedApplication.listBooks({
        filters: {
          shelfId: createdShelf.id,
          search: "darkness",
        },
      }),
    ).resolves.toEqual([updatedBook]);
    await expect(persistedApplication.listShelves()).resolves.toEqual([
      {
        ...createdShelf,
        bookIds: [createdBook.id],
        description: "Frequently revisited books",
      },
    ]);
  });

  it("should persist upload and import review flows through the postgres adapter", async () => {
    const application = createTestApplication();
    const importJob = await application.ingestImportUpload({
      upload: {
        name: "left-hand.epub",
        mimeType: "application/epub+zip",
        contents: new Uint8Array([1, 2, 3]),
      },
    });

    expect(importJob).toEqual({
      id: importJob.id,
      status: "queued",
      source: {
        kind: "upload",
        path: `${config.storage.paths.imports}/${importJob.id}.epub`,
        originalFileName: "left-hand.epub",
      },
      detectedFileType: "epub",
      metadataCandidates: [
        {
          title: "Test Book",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Test Author"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
          confidence: "1.00",
        },
        {
          title: "Test Book",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Test Author"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "external",
          confidence: "0.80",
        },
      ],
      selectedMetadataCandidateIndex: -1,
      duplicateDetection: {
        fileHash: "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
        duplicateImportJobIds: [],
        duplicateBookIds: [],
      },
      error: {
        code: "",
        message: "",
        details: "",
      },
    });
    expect(existsSync(importJob.source.path)).toBe(true);

    const reviewingApplication = createTestApplication();
    const reviewedImportJob = await reviewingApplication.reviewImportJob({
      id: importJob.id,
      metadataCandidateIndex: 0,
    });
    const finalizedImportJob = await reviewingApplication.finalizeImportJob({
      id: importJob.id,
    });

    expect(reviewedImportJob).toEqual({
      ...importJob,
      status: "review",
      selectedMetadataCandidateIndex: 0,
    });
    expect(finalizedImportJob).toEqual({
      ...importJob,
      status: "completed",
      selectedMetadataCandidateIndex: 0,
    });

    const persistedApplication = createTestApplication();

    await expect(persistedApplication.listImportJobs()).resolves.toEqual([
      {
        ...importJob,
        status: "completed",
        selectedMetadataCandidateIndex: 0,
      },
    ]);
    await expect(
      persistedApplication.getImportJob({
        id: importJob.id,
      }),
    ).resolves.toEqual({
      ...importJob,
      status: "completed",
      selectedMetadataCandidateIndex: 0,
    });
  });
});
