/**
 * @import { CreateLogger } from '../../../application/interfaces/logger.js';
 */

import pino from "pino";
import { getLogContext } from "../request-context/index.js";

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

/**
 * @param {unknown[]} args
 * @returns {Record<string, unknown>}
 */
const normalizeLogDetails = (args) => {
  /** @type {Record<string, unknown>} */
  let details = {};

  args.forEach((arg, index) => {
    if (arg instanceof Error) {
      details = {
        ...details,
        error: {
          name: arg.name,
          message: arg.message,
          stack: arg.stack ?? "",
        },
      };
      return;
    }

    if (isRecord(arg)) {
      details = {
        ...details,
        ...arg,
      };
      return;
    }

    details = {
      ...details,
      [`arg${index}`]: arg,
    };
  });

  return details;
};

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

  /**
   * @param {"debug" | "info" | "warn" | "error"} level
   * @returns {(message: string, ...args: unknown[]) => void}
   */
  const createLogMethod = (level) => {
    return (message, ...args) => {
      if (level === "debug" && !debugLogsEnabled) {
        return;
      }

      logger[level](
        {
          ...defaultMetadata,
          ...getLogContext(),
          ...normalizeLogDetails(args),
        },
        message,
      );
    };
  };

  return {
    debug: createLogMethod("debug"),
    info: createLogMethod("info"),
    warn: createLogMethod("warn"),
    error: createLogMethod("error"),
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
