/**
 * @import { CreateLogger } from '../../../application/interfaces/logger.js';
 */

import pino from "pino";

/** @type { CreateLogger } */
const createLoggerPino = ({ config }) => {
  const { debugLogsEnabled, defaultMetadata } = config;

  const logger = pino({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        destination: 1,
      },
    },
  });

  return {
    debug: (message, ...args) =>
      debugLogsEnabled && logger.debug({ ...defaultMetadata, ...args }, message),
    info: (message, ...args) => logger.info({ ...defaultMetadata, ...args }, message),
    warn: (message, ...args) => logger.warn({ ...defaultMetadata, ...args }, message),
    error: (message, ...args) => logger.error({ ...defaultMetadata, ...args }, message),
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

export { createLoggerPino };
