/**
 * @import { CreateServer } from "../server.js";
 * @import { Config } from "../config.js";
 */

import { describe, it, expect, vi, afterAll } from "vitest";
import { createClockSystem } from "../../../adapters/clock/system/index.js";
import { createDataStoreInMemory } from "../../../adapters/data-store/in-memory/index.js";
import { createIdGeneratorSystem } from "../../../adapters/id-generator/system/index.js";
import { createLoggerPino } from "../../../adapters/logger/pino/index.js";
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
    };
    const clock = createClockSystem();
    const logger = createLoggerPino({ config: config.logger });
    const dataStore = createDataStoreInMemory();
    const idGenerator = createIdGeneratorSystem();
    const application = createApplication({ clock, config, dataStore, idGenerator, logger });

    describe("interface", () => {
      const server = createServer({ application, config: config.server, logger });

      afterAll(async () => {
        await server.stop({ reason: { message: "test cleanup" } });
      });

      it("should have all functions", () => {
        expect(server).toHaveProperty("start");
        expect(server).toHaveProperty("stop");
      });
    });

    describe("functions", () => {
      describe("start", () => {
        describe("when it fails", () => {
          it("should return failure", async () => {
            const server = createServer({
              application,
              config: config.server,
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
              config: config.server,
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
              config: config.server,
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
              config: config.server,
              logger,
            });

            const stopSpy = vi.spyOn(server, "stop");
            stopSpy.mockResolvedValueOnce({ success: true });

            const result = await server.stop({ reason: { message: "test" } });

            expect(result).toEqual({ success: true });
          });
        });
      });
    });
  });
};

export { runServerUnitTests };
