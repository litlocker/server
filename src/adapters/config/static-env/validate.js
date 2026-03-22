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
    properties: {
      oidc: {
        properties: {
          issuerUrl: { minLength: 1 },
          clientId: { minLength: 1 },
          clientSecret: { minLength: 1 },
          redirectUrl: { minLength: 1 },
          postLogoutRedirectUrl: { minLength: 1 },
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
        required: [
          "enabled",
          "bootstrapAdminEmail",
          "bootstrapAdminPassword",
          "sessionTtlMs",
          "sessionCookieName",
          "sessionCookieSecure",
          "oidc",
        ],
        properties: {
          enabled: { type: "boolean" },
          bootstrapAdminEmail: { type: "string" },
          bootstrapAdminPassword: { type: "string" },
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
