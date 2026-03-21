/**
 * @import { CreateLogger } from "../logger.js";
 * @import { Config } from "../config.js";
 */

import { describe, it, expect } from "vitest";

/** @param { CreateLogger } createLogger */
const runLoggerUnitTests = (createLogger) => {
  describe("logger", () => {
    /** @type { Config['logger'] } */
    const config = {
      debugLogsEnabled: true,
      defaultMetadata: { serviceName: "test" },
    };
    const logger = createLogger({ config });

    describe("interface", () => {
      it("should have all functions", () => {
        expect(logger).toHaveProperty("debug");
        expect(logger).toHaveProperty("info");
        expect(logger).toHaveProperty("warn");
        expect(logger).toHaveProperty("error");
        expect(logger).toHaveProperty("checkHealth");
      });

      it("should expose health status", () => {
        const result = logger.checkHealth();

        expect(result).toHaveProperty("success");
      });
    });
  });
};

export { runLoggerUnitTests };
