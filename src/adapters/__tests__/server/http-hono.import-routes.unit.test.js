import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import {
  createApplicationMock,
  createExpectedErrorResponse,
  createLoggerMock,
} from "./test-helpers.js";

describe("http hono import routes", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = createLoggerMock();
  const importsConfig = {
    maxFileSizeInBytes: 100_000_000,
    allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
    duplicateCheckEnabled: true,
    uploadRateLimit: {
      windowMs: 60_000,
      maxRequests: 10,
    },
  };

  const createImportJob = () => {
    return {
      id: "import-job-1",
      status: "queued",
      source: {
        kind: "upload",
        path: "/tmp/litlocker/imports/import-job-1.epub",
        originalFileName: "left-hand.epub",
      },
      detectedFileType: "epub",
      metadataCandidates: [],
      selectedMetadataCandidateIndex: -1,
      duplicateDetection: {
        fileHash: "hash-1",
        duplicateImportJobIds: [],
        duplicateBookIds: [],
      },
      error: {
        code: "",
        message: "",
        details: "",
      },
    };
  };

  /**
   * @param {object} params
   * @param {string} params.code
   * @param {string} params.message
   * @param {string} params.details
   */
  const createFailedImportJob = ({ code, message, details }) => {
    return {
      ...createImportJob(),
      status: "failed",
      error: {
        code,
        message,
        details,
      },
    };
  };

  it("should create an import job through POST /imports with JSON", async () => {
    const importJob = createImportJob();
    const application = createApplicationMock({
      createImportJob: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      importJob,
    });
    expect(application.createImportJob).toHaveBeenCalledWith({
      job: {
        source: {
          kind: "filesystem",
          path: "/library/inbox/left-hand.epub",
          originalFileName: "left-hand.epub",
        },
        detectedFileType: "epub",
      },
    });
  });

  it("should ingest an upload through POST /imports multipart", async () => {
    const importJob = createImportJob();
    const application = createApplicationMock({
      ingestImportUpload: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({ application, config, logger });
    const formData = new FormData();

    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/epub+zip",
      }),
    );

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      importJob,
    });
    expect(application.ingestImportUpload).toHaveBeenCalledWith({
      upload: {
        name: "left-hand.epub",
        mimeType: "application/epub+zip",
        contents: new Uint8Array([1, 2, 3]),
      },
    });
  });

  it("should return 400 when POST /imports multipart is missing the file", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "import_file_not_found",
        message: "Import file not found",
      }),
    });
    expect(application.ingestImportUpload).not.toHaveBeenCalled();
  });

  it("should surface unsupported upload failures from the application", async () => {
    const importJob = createFailedImportJob({
      code: "unsupported_file_type",
      message: "Unsupported file type",
      details: "txt is not an allowed import file type",
    });
    const application = createApplicationMock({
      ingestImportUpload: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({ application, config, logger });
    const formData = new FormData();

    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "notes.txt", {
        type: "text/plain",
      }),
    );

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      importJob,
    });
  });

  it("should surface malformed metadata failures from the application", async () => {
    const importJob = createFailedImportJob({
      code: "malformed_metadata",
      message: "Metadata could not be parsed",
      details: "Embedded metadata was malformed",
    });
    const application = createApplicationMock({
      createImportJob: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          source: {
            kind: "filesystem",
            path: "/library/inbox/bad-book.epub",
            originalFileName: "bad-book.epub",
          },
          detectedFileType: "epub",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      importJob,
    });
  });

  it("should propagate storage failures from the application during upload ingestion", async () => {
    const application = createApplicationMock({
      ingestImportUpload: vi.fn().mockImplementation(() => {
        throw new Error("Storage unavailable");
      }),
    });
    const app = createHonoApp({ application, config, logger });
    const formData = new FormData();

    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/epub+zip",
      }),
    );

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(500);
  });

  it("should list import jobs through GET /imports", async () => {
    const importJobs = [createImportJob()];
    const application = createApplicationMock({
      listImportJobs: vi.fn().mockReturnValue(importJobs),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/imports");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      importJobs,
    });
  });

  it("should rate limit multipart uploads", async () => {
    const importJob = createImportJob();
    const application = createApplicationMock({
      ingestImportUpload: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({
      application,
      config,
      importsConfig: {
        ...importsConfig,
        uploadRateLimit: {
          windowMs: 60_000,
          maxRequests: 1,
        },
      },
      logger,
    });
    const firstFormData = new FormData();
    const secondFormData = new FormData();

    firstFormData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/epub+zip",
      }),
    );
    secondFormData.set(
      "file",
      new File([new Uint8Array([4, 5, 6])], "dispossessed.epub", {
        type: "application/epub+zip",
      }),
    );

    const firstResponse = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
        body: firstFormData,
      }),
    );
    const secondResponse = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
        body: secondFormData,
      }),
    );

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(429);
    await expect(secondResponse.json()).resolves.toEqual(
      createExpectedErrorResponse({
        code: "upload_rate_limit_exceeded",
        message: "Upload rate limit exceeded",
        details: {
          area: "imports",
          maxRequests: 1,
          windowMs: 60_000,
        },
      }),
    );
  });

  it("should fetch an import job through GET /imports/:id", async () => {
    const importJob = createImportJob();
    const application = createApplicationMock({
      getImportJob: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/imports/import-job-1");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      importJob,
    });
    expect(application.getImportJob).toHaveBeenCalledWith({
      id: "import-job-1",
    });
  });

  it("should return 404 for a missing import job through GET /imports/:id", async () => {
    const application = createApplicationMock({
      getImportJob: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/imports/missing-import-job-id");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "import_job_not_found",
        message: "Import job not found",
        details: {
          id: "missing-import-job-id",
        },
      }),
    });
  });

  it("should finalize an import job through POST /imports/:id/finalize", async () => {
    const importJob = {
      ...createImportJob(),
      status: "completed",
    };
    const application = createApplicationMock({
      finalizeImportJob: vi.fn().mockReturnValue(importJob),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/imports/import-job-1/finalize", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      importJob,
    });
    expect(application.finalizeImportJob).toHaveBeenCalledWith({
      id: "import-job-1",
    });
  });

  it("should return 404 when an import job cannot be finalized", async () => {
    const application = createApplicationMock({
      finalizeImportJob: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/imports/import-job-1/finalize", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "import_job_not_found_or_not_finalizable",
        message: "Import job not found or cannot be finalized",
        details: {
          id: "import-job-1",
        },
      }),
    });
  });
});
