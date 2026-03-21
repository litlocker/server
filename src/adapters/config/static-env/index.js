/**
 * @import { Config, CreateConfig } from '../../../application/interfaces/config.js'
 */

import { validateConfig } from "./validate.js";

/** @type { CreateConfig } */
const createConfigStaticEnv = () => {
  /** @type { Config } */
  const config = {
    logger: {
      debugLogsEnabled: process.env.LOGGER__DEBUG_LOGS_ENABLED === "true",
      defaultMetadata: { service: "litlocker-server" },
    },
    server: {
      http: {
        address: process.env.SERVER__HTTP__ADDRESS || "http://localhost:3000",
        timeoutMs: Number(process.env.SERVER__HTTP__TIMEOUT_MS) || 9000,
        port: Number(process.env.SERVER__HTTP__PORT) || 3000,
      },
    },
  };

  const isConfigValid = validateConfig(config);
  if (!isConfigValid.success) {
    throw new Error(`Invalid configuration: ${isConfigValid.errors?.join(", ")}`);
  }

  return config;
};

export { createConfigStaticEnv };
