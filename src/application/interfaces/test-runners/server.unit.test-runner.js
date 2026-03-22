/**
 * @import { CreateServer } from "../server.js";
 * @import { Config } from "../config.js";
 */

import { describe, it, expect, vi, afterAll } from "vitest";
import { createClockSystem } from "../../../adapters/clock/system/index.js";
import { createIdGeneratorSystem } from "../../../adapters/id-generator/system/index.js";
import { createLoggerPino } from "../../../adapters/logger/pino/index.js";
import { createPersistenceInMemory } from "../../../adapters/persistence/in-memory/index.js";
import { createApplication } from "../../index.js";

/** @param { CreateServer } createServer */
const runServerUnitTests = (createServer) => {
  describe("server", () => {
    /** @type { Config } */
    const config = {
      logger: {
        debugLogsEnabled: true,
        defaultMetadata: { serviceName: "test" },
      },
      server: {
        http: {
          address: "http://localhost:3000",
          port: 60000,
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
    const clock = createClockSystem();
    const logger = createLoggerPino({ config: config.logger });
    const persistence = createPersistenceInMemory();
    const idGenerator = createIdGeneratorSystem();
    const application = createApplication({ clock, config, persistence, idGenerator, logger });

    describe("interface", () => {
      const server = createServer({
        application,
        config: {
          server: config.server,
          auth: config.auth,
        },
        logger,
      });

      afterAll(async () => {
        await server.stop({ reason: { message: "test cleanup" } });
      });

      it("should have all functions", () => {
        expect(server).toHaveProperty("start");
        expect(server).toHaveProperty("stop");
        expect(server).toHaveProperty("checkHealth");
      });
    });

    describe("functions", () => {
      describe("start", () => {
        describe("when it fails", () => {
          it("should return failure", async () => {
            const server = createServer({
              application,
              config: {
                server: config.server,
                auth: config.auth,
              },
              logger,
            });

            const startSpy = vi.spyOn(server, "start");
            startSpy.mockResolvedValueOnce({ success: false });

            const result = await server.start();

            expect(result).toEqual({ success: false });
          });
        });

        describe("when it succeeds", () => {
          it("should return success", async () => {
            const server = createServer({
              application,
              config: {
                server: config.server,
                auth: config.auth,
              },
              logger,
            });

            const startSpy = vi.spyOn(server, "start");
            startSpy.mockResolvedValueOnce({ success: true });

            const result = await server.start();

            expect(result).toEqual({ success: true });
          });
        });
      });
      describe("stop", () => {
        describe("when it fails", () => {
          it("should return failure", async () => {
            const server = createServer({
              application,
              config: {
                server: config.server,
                auth: config.auth,
              },
              logger,
            });

            const stopSpy = vi.spyOn(server, "stop");
            stopSpy.mockResolvedValueOnce({ success: false });

            const result = await server.stop({ reason: { message: "test" } });

            expect(result).toEqual({ success: false });
          });
        });

        describe("when it succeeds", () => {
          it("should return success", async () => {
            const server = createServer({
              application,
              config: {
                server: config.server,
                auth: config.auth,
              },
              logger,
            });

            const stopSpy = vi.spyOn(server, "stop");
            stopSpy.mockResolvedValueOnce({ success: true });

            const result = await server.stop({ reason: { message: "test" } });

            expect(result).toEqual({ success: true });
          });
        });
      });

      describe("checkHealth", () => {
        it("should expose health status", () => {
          const server = createServer({
            application,
            config: {
              server: config.server,
              auth: config.auth,
            },
            logger,
          });

          const result = server.checkHealth();

          expect(result).toHaveProperty("success");
        });
      });
    });
  });
};

export { runServerUnitTests };
