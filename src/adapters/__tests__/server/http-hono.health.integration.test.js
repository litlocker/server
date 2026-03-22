import { describe, expect, it } from "vitest";
import { createApplication } from "../../../application/index.js";
import { createClockSystem } from "../../clock/system/index.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";
import { createLoggerPino } from "../../logger/pino/index.js";
import { createPersistenceInMemory } from "../../persistence/in-memory/index.js";
import { createHonoApp } from "../../server/http-hono/app.js";

describe("http hono health route integration", () => {
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
        library: "/tmp/litlocker/library",
        imports: "/tmp/litlocker/imports",
        covers: "/tmp/litlocker/covers",
      },
    },
    imports: {
      maxFileSizeInBytes: 50_000_000,
      allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
      duplicateCheckEnabled: true,
    },
    auth: {
      enabled: false,
      bootstrapAdminEmail: "",
      bootstrapAdminPassword: "",
      sessionTtlMs: 86_400_000,
    },
    metadataProviders: {
      enabledProviders: ["open-library"],
      lookupTimeoutMs: 5_000,
      defaultLanguage: "en",
    },
  };

  it("should return aggregated dependency health details through GET /health", async () => {
    const clock = createClockSystem();
    const logger = createLoggerPino({ config: config.logger });
    const persistence = createPersistenceInMemory();
    const idGenerator = createIdGeneratorSystem();
    const application = createApplication({ clock, config, persistence, idGenerator, logger });
    const app = createHonoApp({
      application,
      config: config.server,
      logger,
    });

    const response = await app.request("http://localhost/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      details: {
        checks: {
          clock: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          fileStorage: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          persistence: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          idGenerator: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          logger: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
        },
      },
    });
  });
});
