/**
 * @import { Config } from '../../../application/interfaces/config.js'
 */

import Ajv from "ajv";

/**
 * @param { Config } config
 */
const validateConfig = (config) => {
  const ajv = new Ajv.default();
  const schema = {
    type: "object",
    required: ["logger", "server", "storage", "imports", "auth", "metadataProviders"],
    properties: {
      logger: {
        type: "object",
        required: ["debugLogsEnabled", "defaultMetadata"],
        properties: {
          debugLogsEnabled: { type: "boolean" },
          defaultMetadata: { type: "object" },
        },
      },
      server: {
        type: "object",
        required: ["http"],
        properties: {
          http: {
            type: "object",
            required: ["address", "timeoutMs", "port"],
            properties: {
              address: { type: "string" },
              timeoutMs: { type: "number" },
              port: { type: "number" },
            },
          },
        },
      },
      storage: {
        type: "object",
        required: ["paths"],
        properties: {
          paths: {
            type: "object",
            required: ["library", "imports", "covers"],
            properties: {
              library: { type: "string", minLength: 1 },
              imports: { type: "string", minLength: 1 },
              covers: { type: "string", minLength: 1 },
            },
          },
        },
      },
      imports: {
        type: "object",
        required: ["maxFileSizeInBytes", "allowedFileExtensions", "duplicateCheckEnabled"],
        properties: {
          maxFileSizeInBytes: { type: "number", minimum: 1 },
          allowedFileExtensions: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          duplicateCheckEnabled: { type: "boolean" },
        },
      },
      auth: {
        type: "object",
        required: ["enabled", "bootstrapAdminEmail", "bootstrapAdminPassword", "sessionTtlMs"],
        properties: {
          enabled: { type: "boolean" },
          bootstrapAdminEmail: { type: "string" },
          bootstrapAdminPassword: { type: "string" },
          sessionTtlMs: { type: "number", minimum: 1 },
        },
      },
      metadataProviders: {
        type: "object",
        required: ["enabledProviders", "lookupTimeoutMs", "defaultLanguage"],
        properties: {
          enabledProviders: {
            type: "array",
            items: { type: "string", minLength: 1 },
          },
          lookupTimeoutMs: { type: "number", minimum: 1 },
          defaultLanguage: { type: "string", minLength: 1 },
        },
      },
    },
  };

  const valid = ajv.validate(schema, config);

  if (!valid && ajv.errors) {
    return {
      success: false,
      errors: ajv.errors.map((error) => `${error.instancePath} ${error.message}`),
    };
  }

  return {
    success: true,
  };
};

export { validateConfig };
