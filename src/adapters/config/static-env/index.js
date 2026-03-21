/**
 * @import { Config, CreateConfig } from '../../../application/interfaces/config.js'
 */

import { validateConfig } from "./validate.js";

/**
 * @param { object } params
 * @param { string } params.name
 * @param { number } params.defaultValue
 * @returns { number }
 */
const getEnvNumber = ({ name, defaultValue }) => {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return Number(value);
};

/**
 * @param { object } params
 * @param { string } params.name
 * @param { boolean } params.defaultValue
 * @returns { boolean }
 */
const getEnvBoolean = ({ name, defaultValue }) => {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  // if `value` is not a boolean, the validator will let us know
  // which is why i'm ignoring this ts error
  // @ts-ignore
  return value;
};

/**
 * @param { object } params
 * @param { string } params.name
 * @param { string[] } params.defaultValue
 * @returns { string[] }
 */
const getEnvStringArray = ({ name, defaultValue }) => {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return value.split(",").map((part) => part.trim());
};

/** @type { CreateConfig } */
const createConfigStaticEnv = () => {
  /** @type { Config } */
  const config = {
    logger: {
      debugLogsEnabled: getEnvBoolean({
        name: "LOGGER__DEBUG_LOGS_ENABLED",
        defaultValue: false,
      }),
      defaultMetadata: { service: "litlocker-server" },
    },
    server: {
      http: {
        address: process.env.SERVER__HTTP__ADDRESS || "http://localhost:3000",
        timeoutMs: getEnvNumber({
          name: "SERVER__HTTP__TIMEOUT_MS",
          defaultValue: 9000,
        }),
        port: getEnvNumber({
          name: "SERVER__HTTP__PORT",
          defaultValue: 3000,
        }),
      },
    },
    storage: {
      paths: {
        library: process.env.STORAGE__PATHS__LIBRARY || "./data/library",
        imports: process.env.STORAGE__PATHS__IMPORTS || "./data/imports",
        covers: process.env.STORAGE__PATHS__COVERS || "./data/covers",
      },
    },
    imports: {
      maxFileSizeInBytes: getEnvNumber({
        name: "IMPORTS__MAX_FILE_SIZE_IN_BYTES",
        defaultValue: 100_000_000,
      }),
      allowedFileExtensions: getEnvStringArray({
        name: "IMPORTS__ALLOWED_FILE_EXTENSIONS",
        defaultValue: ["epub", "pdf", "cbz", "cbr"],
      }),
      duplicateCheckEnabled: getEnvBoolean({
        name: "IMPORTS__DUPLICATE_CHECK_ENABLED",
        defaultValue: true,
      }),
    },
    auth: {
      enabled: getEnvBoolean({
        name: "AUTH__ENABLED",
        defaultValue: false,
      }),
      bootstrapAdminEmail: process.env.AUTH__BOOTSTRAP_ADMIN_EMAIL || "",
      bootstrapAdminPassword: process.env.AUTH__BOOTSTRAP_ADMIN_PASSWORD || "",
      sessionTtlMs: getEnvNumber({
        name: "AUTH__SESSION_TTL_MS",
        defaultValue: 86_400_000,
      }),
    },
    metadataProviders: {
      enabledProviders: getEnvStringArray({
        name: "METADATA_PROVIDERS__ENABLED_PROVIDERS",
        defaultValue: ["open-library"],
      }),
      lookupTimeoutMs: getEnvNumber({
        name: "METADATA_PROVIDERS__LOOKUP_TIMEOUT_MS",
        defaultValue: 5_000,
      }),
      defaultLanguage: process.env.METADATA_PROVIDERS__DEFAULT_LANGUAGE || "en",
    },
  };

  const validationResult = validateConfig(config);

  if (!validationResult.success) {
    throw new Error(`Invalid configuration: ${validationResult.errors?.join(", ")}`);
  }

  return config;
};

export { createConfigStaticEnv };
