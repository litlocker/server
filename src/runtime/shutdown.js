/**
 * @import { Logger } from "../application/interfaces/logger.js"
 * @import { Server } from "../application/interfaces/server.js"
 */

/**
 * @typedef {{ end: () => Promise<void> }} ClosablePool
 */

/**
 * @param {object} [params]
 * @param {Record<string, unknown>} [params.reason]
 * @returns {Promise<{ success: boolean }>}
 */
const createDefaultShutdownStep = (params = {}) => {
  void params;

  return Promise.resolve({ success: true });
};

/**
 * @param {object} params
 * @param {Logger} params.logger
 * @param {Server} params.server
 * @param {{ pool?: ClosablePool }} [params.persistence]
 * @param {(params: { reason: Record<string, unknown> }) => Promise<{ success: boolean }>} [params.onBeforeShutdown]
 * @returns {(params: { reason: Record<string, unknown>; exitCode?: number }) => Promise<{ success: boolean }>}
 */
const createRuntimeShutdown = ({
  logger,
  server,
  persistence,
  onBeforeShutdown = createDefaultShutdownStep,
}) => {
  /** @type {Promise<{ success: boolean }> | null} */
  let activeShutdown = null;

  return ({ reason, exitCode = 0 }) => {
    if (activeShutdown) {
      return activeShutdown;
    }

    activeShutdown = (async () => {
      logger.info("Graceful shutdown started", {
        reasonForShutdown: reason,
        exitCode,
      });

      const backgroundWorkResult = await onBeforeShutdown({ reason });
      const serverResult = await server.stop({ reason });

      const pool = persistence?.pool;
      if (pool) {
        await pool.end();
        logger.info("Persistence connections closed", {
          reasonForShutdown: reason,
        });
      }

      const success = backgroundWorkResult.success && serverResult.success;
      logger.info("Graceful shutdown completed", {
        reasonForShutdown: reason,
        exitCode,
        success,
      });

      return { success };
    })().catch((error) => {
      logger.error("Graceful shutdown failed", {
        reasonForShutdown: reason,
        exitCode,
        error,
      });

      return { success: false };
    });

    return activeShutdown;
  };
};

export { createRuntimeShutdown };
