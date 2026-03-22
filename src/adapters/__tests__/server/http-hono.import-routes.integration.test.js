import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createApplication } from "../../../application/index.js";
import { createClockSystem } from "../../clock/system/index.js";
import { createFileStorageLocalFilesystem } from "../../file-storage/local-filesystem/index.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";
import { createLoggerPino } from "../../logger/pino/index.js";
import { createMetadataProviderStatic } from "../../metadata-provider/static/index.js";
import { createPersistenceInMemory } from "../../persistence/in-memory/index.js";
import { createHonoApp } from "../../server/http-hono/app.js";
import { createExpectedErrorResponse } from "./test-helpers.js";

describe("http hono import routes integration", () => {
  const testRootPath = mkdtempSync(join(tmpdir(), "litlocker-import-routes-"));
  const config = {
    logger: {
      debugLogsEnabled: true,
      defaultMetadata: { serviceName: "test" },
    },
    server: {
      http: {
        address: "http://localhost:3000",
        port: 3000,
        timeoutMs: 1000,
      },
    },
    storage: {
      paths: {
        library: join(testRootPath, "library"),
        imports: join(testRootPath, "imports"),
        covers: join(testRootPath, "covers"),
      },
    },
    imports: {
      maxFileSizeInBytes: 50_000_000,
      allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
      duplicateCheckEnabled: true,
      uploadRateLimit: {
        windowMs: 60_000,
        maxRequests: 10,
      },
    },
    database: {
      host: "localhost",
      port: 15_432,
      user: "devdb",
      password: "devpass",
      database: "devdb",
      schema: "litlocker",
      sslEnabled: false,
      poolMaxConnections: 10,
      poolIdleTimeoutMs: 30_000,
      connectionTimeoutMs: 5_000,
    },
    auth: {
      enabled: false,
      bootstrapAdminEmail: "",
      bootstrapAdminPassword: "",
      sessionSecret: "0123456789abcdef0123456789abcdef",
      sessionTtlMs: 86_400_000,
      sessionCookieName: "litlocker-session",
      sessionCookieSecure: false,
      rateLimit: {
        windowMs: 60_000,
        maxRequests: 10,
      },
      oidc: {
        issuerUrl: "",
        clientId: "",
        clientSecret: "",
        redirectUrl: "",
        postLogoutRedirectUrl: "",
        scopes: ["openid", "profile", "email"],
        requirePkce: true,
        discoveryTimeoutMs: 5_000,
      },
    },
    metadataProviders: {
      enabledProviders: ["open-library"],
      lookupTimeoutMs: 5_000,
      defaultLanguage: "en",
    },
  };

  afterAll(() => {
    rmSync(testRootPath, { recursive: true, force: true });
  });

  const createTestApp = () => {
    const clock = createClockSystem();
    const fileStorage = createFileStorageLocalFilesystem({ config });
    const logger = createLoggerPino({ config: config.logger });
    const metadataProvider = createMetadataProviderStatic();
    const persistence = createPersistenceInMemory();
    const idGenerator = createIdGeneratorSystem();
    const application = createApplication({
      clock,
      config,
      fileStorage,
      metadataProvider,
      persistence,
      idGenerator,
      logger,
    });

    return createHonoApp({
      application,
      config: config.server,
      logger,
    });
  };

  it("should ingest uploads, retrieve import status, and finalize review-free imports through the API", async () => {
    const app = createTestApp();
    const uploadFormData = new FormData();

    uploadFormData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/epub+zip",
      }),
    );

    const uploadResponse = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: uploadFormData,
      }),
    );

    expect(uploadResponse.status).toBe(201);
    const { importJob: uploadedImportJob } = await uploadResponse.json();

    expect(uploadedImportJob).toEqual({
      id: uploadedImportJob.id,
      status: "queued",
      source: {
        kind: "upload",
        path: `${config.storage.paths.imports}/${uploadedImportJob.id}.epub`,
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

    const getUploadResponse = await app.request(`http://localhost/imports/${uploadedImportJob.id}`);

    expect(getUploadResponse.status).toBe(200);
    await expect(getUploadResponse.json()).resolves.toEqual({
      importJob: uploadedImportJob,
    });

    const createResponse = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          source: {
            kind: "filesystem",
            path: "/library/inbox/manual-import.epub",
            originalFileName: "manual-import.epub",
          },
        }),
      }),
    );
    const { importJob: createdImportJob } = await createResponse.json();

    const listResponse = await app.request("http://localhost/imports");

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toEqual({
      importJobs: [uploadedImportJob, createdImportJob],
    });

    const finalizeResponse = await app.request(
      new Request(`http://localhost/imports/${createdImportJob.id}/finalize`, {
        method: "POST",
      }),
    );

    expect(finalizeResponse.status).toBe(200);
    await expect(finalizeResponse.json()).resolves.toEqual({
      importJob: {
        ...createdImportJob,
        status: "completed",
      },
    });
  });

  it("should return a 404 when an import job cannot be found or finalized", async () => {
    const app = createTestApp();

    const getResponse = await app.request("http://localhost/imports/missing-import-job-id");

    expect(getResponse.status).toBe(404);
    await expect(getResponse.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "import_job_not_found",
        message: "Import job not found",
        details: {
          id: "missing-import-job-id",
        },
      }),
    });

    const finalizeResponse = await app.request(
      new Request("http://localhost/imports/missing-import-job-id/finalize", {
        method: "POST",
      }),
    );

    expect(finalizeResponse.status).toBe(404);
    await expect(finalizeResponse.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "import_job_not_found_or_not_finalizable",
        message: "Import job not found or cannot be finalized",
        details: {
          id: "missing-import-job-id",
        },
      }),
    });
  });

  it("should flag duplicate uploads through the API", async () => {
    const app = createTestApp();
    const firstUploadFormData = new FormData();
    const secondUploadFormData = new FormData();

    firstUploadFormData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "first-copy.epub", {
        type: "application/epub+zip",
      }),
    );
    secondUploadFormData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "second-copy.epub", {
        type: "application/epub+zip",
      }),
    );

    const firstUploadResponse = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: firstUploadFormData,
      }),
    );
    const { importJob: firstImportJob } = await firstUploadResponse.json();

    const secondUploadResponse = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: secondUploadFormData,
      }),
    );

    expect(secondUploadResponse.status).toBe(201);
    await expect(secondUploadResponse.json()).resolves.toEqual({
      importJob: {
        id: expect.any(String),
        status: "queued",
        source: {
          kind: "upload",
          path: expect.stringContaining(`${config.storage.paths.imports}/`),
          originalFileName: "second-copy.epub",
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
          duplicateImportJobIds: [firstImportJob.id],
          duplicateBookIds: [],
        },
        error: {
          code: "",
          message: "",
          details: "",
        },
      },
    });
  });
});
