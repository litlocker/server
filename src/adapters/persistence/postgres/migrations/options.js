/**
 * @import { RunnerOption } from "node-pg-migrate"
 * @import { Config } from "../../../../application/interfaces/config.js"
 * @import { Logger } from "../../../../application/interfaces/logger.js"
 * @import { ClientConfig } from "pg"
 */

import { fileURLToPath } from "node:url";

const migrationsDirectoryPath = fileURLToPath(new URL("./files", import.meta.url));
const migrationsTableName = "migrations";

/**
 * @param {object} params
 * @param {Config} params.config
 * @returns {ClientConfig}
 */
const createPostgresMigrationDatabaseUrl = ({ config }) => {
  return {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    ssl: config.database.sslEnabled ? { rejectUnauthorized: false } : false,
  };
};

/**
 * @param {object} params
 * @param {Config} params.config
 * @param {RunnerOption["direction"]} params.direction
 * @param {number} params.count
 * @param {Logger} [params.logger]
 * @returns {RunnerOption}
 */
const createPostgresMigrationOptions = ({ config, direction, count, logger }) => {
  return {
    databaseUrl: createPostgresMigrationDatabaseUrl({ config }),
    dir: migrationsDirectoryPath,
    direction,
    count,
    schema: config.database.schema,
    createSchema: true,
    migrationsSchema: config.database.schema,
    createMigrationsSchema: true,
    migrationsTable: migrationsTableName,
    singleTransaction: true,
    decamelize: false,
    logger: logger
      ? {
          debug: logger.debug,
          info: logger.info,
          warn: logger.warn,
          error: logger.error,
        }
      : undefined,
  };
};

export {
  createPostgresMigrationDatabaseUrl,
  createPostgresMigrationOptions,
  migrationsDirectoryPath,
  migrationsTableName,
};
