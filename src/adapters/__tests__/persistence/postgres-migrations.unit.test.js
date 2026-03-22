/**
 * @import { Config } from "../../../application/interfaces/config.js"
 * @import { Logger } from "../../../application/interfaces/logger.js"
 */

import { describe, expect, it } from "vitest";
import {
  createPostgresMigrationDatabaseUrl,
  createPostgresMigrationOptions,
  migrationsDirectoryPath,
  migrationsTableName,
} from "../../persistence/postgres/migrations/options.js";

describe("postgres migrations", () => {
  /** @type {Config} */
  const config = {
    logger: {
      debugLogsEnabled: true,
      defaultMetadata: { serviceName: "test" },
    },
    server: {
      http: {
        address: "http://localhost:3000",
        port: 3000,
        timeoutMs: 1000,
      },
    },
    storage: {
      paths: {
        library: "/tmp/litlocker/library",
        imports: "/tmp/litlocker/imports",
        covers: "/tmp/litlocker/covers",
      },
    },
    imports: {
      maxFileSizeInBytes: 50_000_000,
      allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
      duplicateCheckEnabled: true,
    },
    database: {
      host: "localhost",
      port: 15_432,
      user: "devdb",
      password: "devpass",
      database: "devdb",
      schema: "litlocker",
      sslEnabled: false,
      poolMaxConnections: 10,
      poolIdleTimeoutMs: 30_000,
      connectionTimeoutMs: 5_000,
    },
    auth: {
      enabled: false,
      bootstrapAdminEmail: "",
      bootstrapAdminPassword: "",
      sessionSecret: "0123456789abcdef0123456789abcdef",
      sessionTtlMs: 86_400_000,
      sessionCookieName: "litlocker-session",
      sessionCookieSecure: false,
      oidc: {
        issuerUrl: "",
        clientId: "",
        clientSecret: "",
        redirectUrl: "",
        postLogoutRedirectUrl: "",
        scopes: ["openid", "profile", "email"],
        requirePkce: true,
        discoveryTimeoutMs: 5_000,
      },
    },
    metadataProviders: {
      enabledProviders: ["open-library"],
      lookupTimeoutMs: 5_000,
      defaultLanguage: "en",
    },
  };

  /** @type {Logger} */
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    checkHealth: () => {
      return {
        success: true,
        data: {
          status: "ok",
          details: {},
        },
      };
    },
  };

  it("should build database connection options from the app config", () => {
    expect(createPostgresMigrationDatabaseUrl({ config })).toEqual({
      host: "localhost",
      port: 15_432,
      user: "devdb",
      password: "devpass",
      database: "devdb",
      ssl: false,
    });
  });

  it("should build migration runner options for the litlocker schema", () => {
    const options = createPostgresMigrationOptions({
      config,
      direction: "up",
      count: Number.POSITIVE_INFINITY,
      logger,
    });

    expect(options).toMatchObject({
      databaseUrl: {
        host: "localhost",
        port: 15_432,
        user: "devdb",
        password: "devpass",
        database: "devdb",
        ssl: false,
      },
      direction: "up",
      count: Number.POSITIVE_INFINITY,
      schema: "litlocker",
      createSchema: true,
      migrationsSchema: "litlocker",
      createMigrationsSchema: true,
      migrationsTable: migrationsTableName,
      singleTransaction: true,
      decamelize: false,
      logger: {
        debug: logger.debug,
        info: logger.info,
        warn: logger.warn,
        error: logger.error,
      },
    });
    expect(options.dir).toBe(migrationsDirectoryPath);
    expect(migrationsDirectoryPath).toContain(
      "/src/adapters/persistence/postgres/migrations/files",
    );
  });
});
