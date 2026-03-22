/**
 * @import { Config } from "../../../../application/interfaces/config.js"
 * @import { Logger } from "../../../../application/interfaces/logger.js"
 */

import { runner } from "node-pg-migrate";
import { createPostgresMigrationOptions } from "./options.js";

/**
 * @param {object} params
 * @param {Config} params.config
 * @param {"up" | "down"} params.direction
 * @param {number} params.count
 * @param {Logger} [params.logger]
 * @returns {Promise<void>}
 */
const runPostgresMigrations = async ({ config, direction, count, logger }) => {
  await runner(
    createPostgresMigrationOptions({
      config,
      direction,
      count,
      logger,
    }),
  );
};

/**
 * @param {object} params
 * @param {Config} params.config
 * @param {Logger} [params.logger]
 * @returns {Promise<void>}
 */
const runPendingPostgresMigrations = async ({ config, logger }) => {
  await runPostgresMigrations({
    config,
    direction: "up",
    count: Number.POSITIVE_INFINITY,
    logger,
  });
};

export { runPendingPostgresMigrations, runPostgresMigrations };
