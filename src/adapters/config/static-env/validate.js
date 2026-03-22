/**
 * @import { Config } from '../../../application/interfaces/config.js'
 */

import Ajv from "ajv";

/**
 * @param { Config } config
 */
const validateConfig = (config) => {
  const ajv = new Ajv.default();
  const authEnabledRequirement = {
    properties: {
      enabled: { const: true },
    },
  };
  const authOidcSettingsRequirement = {
    type: "object",
    properties: {
      oidc: {
        type: "object",
        properties: {
          issuerUrl: { type: "string", minLength: 1 },
          clientId: { type: "string", minLength: 1 },
          clientSecret: { type: "string", minLength: 1 },
          redirectUrl: { type: "string", minLength: 1 },
          postLogoutRedirectUrl: { type: "string", minLength: 1 },
        },
      },
    },
  };
  const authEnabledOidcValidation = Object.fromEntries([
    ["if", authEnabledRequirement],
    // oxlint-disable-next-line unicorn/no-thenable
    ["then", authOidcSettingsRequirement],
  ]);

  const schema = {
    type: "object",
    required: ["logger", "server", "storage", "imports", "database", "auth", "metadataProviders"],
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
      database: {
        type: "object",
        required: [
          "host",
          "port",
          "user",
          "password",
          "database",
          "schema",
          "sslEnabled",
          "poolMaxConnections",
          "poolIdleTimeoutMs",
          "connectionTimeoutMs",
        ],
        properties: {
          host: { type: "string", minLength: 1 },
          port: { type: "number", minimum: 1 },
          user: { type: "string", minLength: 1 },
          password: { type: "string", minLength: 1 },
          database: { type: "string", minLength: 1 },
          schema: { type: "string", pattern: "^[A-Za-z_][A-Za-z0-9_]*$" },
          sslEnabled: { type: "boolean" },
          poolMaxConnections: { type: "number", minimum: 1 },
          poolIdleTimeoutMs: { type: "number", minimum: 1 },
          connectionTimeoutMs: { type: "number", minimum: 1 },
        },
      },
      auth: {
        type: "object",
        required: [
          "enabled",
          "bootstrapAdminEmail",
          "bootstrapAdminPassword",
          "sessionSecret",
          "sessionTtlMs",
          "sessionCookieName",
          "sessionCookieSecure",
          "oidc",
        ],
        properties: {
          enabled: { type: "boolean" },
          bootstrapAdminEmail: { type: "string" },
          bootstrapAdminPassword: { type: "string" },
          sessionSecret: { type: "string", minLength: 32 },
          sessionTtlMs: { type: "number", minimum: 1 },
          sessionCookieName: { type: "string", minLength: 1 },
          sessionCookieSecure: { type: "boolean" },
          oidc: {
            type: "object",
            required: [
              "issuerUrl",
              "clientId",
              "clientSecret",
              "redirectUrl",
              "postLogoutRedirectUrl",
              "scopes",
              "requirePkce",
              "discoveryTimeoutMs",
            ],
            properties: {
              issuerUrl: { type: "string" },
              clientId: { type: "string" },
              clientSecret: { type: "string" },
              redirectUrl: { type: "string" },
              postLogoutRedirectUrl: { type: "string" },
              scopes: {
                type: "array",
                items: { type: "string", minLength: 1 },
                minItems: 1,
              },
              requirePkce: { type: "boolean" },
              discoveryTimeoutMs: { type: "number", minimum: 1 },
            },
          },
        },
        allOf: [authEnabledOidcValidation],
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
