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
    required: ["logger", "server"],
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
