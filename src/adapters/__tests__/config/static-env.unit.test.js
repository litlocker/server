import { afterEach, describe, expect, it } from "vitest";
import { createConfigStaticEnv } from "../../config/static-env/index.js";

const ORIGINAL_ENV = { ...process.env };

const resetEnvironment = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
};

afterEach(() => {
  resetEnvironment();
});

describe("static env config adapter", () => {
  it("should expose the full config shape with defaults", () => {
    delete process.env.LOGGER__DEBUG_LOGS_ENABLED;
    delete process.env.SERVER__HTTP__ADDRESS;
    delete process.env.SERVER__HTTP__TIMEOUT_MS;
    delete process.env.SERVER__HTTP__PORT;
    delete process.env.STORAGE__PATHS__LIBRARY;
    delete process.env.STORAGE__PATHS__IMPORTS;
    delete process.env.STORAGE__PATHS__COVERS;
    delete process.env.IMPORTS__MAX_FILE_SIZE_IN_BYTES;
    delete process.env.IMPORTS__ALLOWED_FILE_EXTENSIONS;
    delete process.env.IMPORTS__DUPLICATE_CHECK_ENABLED;
    delete process.env.DATABASE__HOST;
    delete process.env.DATABASE__PORT;
    delete process.env.DATABASE__USER;
    delete process.env.DATABASE__PASSWORD;
    delete process.env.DATABASE__DATABASE;
    delete process.env.DATABASE__SCHEMA;
    delete process.env.DATABASE__SSL_ENABLED;
    delete process.env.DATABASE__POOL_MAX_CONNECTIONS;
    delete process.env.DATABASE__POOL_IDLE_TIMEOUT_MS;
    delete process.env.DATABASE__CONNECTION_TIMEOUT_MS;
    delete process.env.AUTH__ENABLED;
    delete process.env.AUTH__BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.AUTH__BOOTSTRAP_ADMIN_PASSWORD;
    delete process.env.AUTH__SESSION_SECRET;
    delete process.env.AUTH__SESSION_TTL_MS;
    delete process.env.AUTH__SESSION_COOKIE_NAME;
    delete process.env.AUTH__SESSION_COOKIE_SECURE;
    delete process.env.AUTH__OIDC__ISSUER_URL;
    delete process.env.AUTH__OIDC__CLIENT_ID;
    delete process.env.AUTH__OIDC__CLIENT_SECRET;
    delete process.env.AUTH__OIDC__REDIRECT_URL;
    delete process.env.AUTH__OIDC__POST_LOGOUT_REDIRECT_URL;
    delete process.env.AUTH__OIDC__SCOPES;
    delete process.env.AUTH__OIDC__REQUIRE_PKCE;
    delete process.env.AUTH__OIDC__DISCOVERY_TIMEOUT_MS;
    delete process.env.METADATA_PROVIDERS__ENABLED_PROVIDERS;
    delete process.env.METADATA_PROVIDERS__LOOKUP_TIMEOUT_MS;
    delete process.env.METADATA_PROVIDERS__DEFAULT_LANGUAGE;

    expect(createConfigStaticEnv()).toEqual({
      logger: {
        debugLogsEnabled: false,
        defaultMetadata: { service: "litlocker-server" },
      },
      server: {
        http: {
          address: "http://localhost:3000",
          timeoutMs: 9000,
          port: 3000,
        },
      },
      storage: {
        paths: {
          library: "./data/library",
          imports: "./data/imports",
          covers: "./data/covers",
        },
      },
      imports: {
        maxFileSizeInBytes: 100_000_000,
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
        sessionSecret: "litlocker-development-session-secret",
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
    });
  });

  it("should parse config overrides from env vars", () => {
    process.env.LOGGER__DEBUG_LOGS_ENABLED = "true";
    process.env.SERVER__HTTP__ADDRESS = "http://0.0.0.0:4000";
    process.env.SERVER__HTTP__TIMEOUT_MS = "12000";
    process.env.SERVER__HTTP__PORT = "4000";
    process.env.STORAGE__PATHS__LIBRARY = "/srv/litlocker/library";
    process.env.STORAGE__PATHS__IMPORTS = "/srv/litlocker/imports";
    process.env.STORAGE__PATHS__COVERS = "/srv/litlocker/covers";
    process.env.IMPORTS__MAX_FILE_SIZE_IN_BYTES = "250000000";
    process.env.IMPORTS__ALLOWED_FILE_EXTENSIONS = "epub,pdf";
    process.env.IMPORTS__DUPLICATE_CHECK_ENABLED = "false";
    process.env.DATABASE__HOST = "postgres.internal";
    process.env.DATABASE__PORT = "25432";
    process.env.DATABASE__USER = "litlocker";
    process.env.DATABASE__PASSWORD = "db-secret";
    process.env.DATABASE__DATABASE = "litlocker";
    process.env.DATABASE__SCHEMA = "litlocker_app";
    process.env.DATABASE__SSL_ENABLED = "true";
    process.env.DATABASE__POOL_MAX_CONNECTIONS = "20";
    process.env.DATABASE__POOL_IDLE_TIMEOUT_MS = "45000";
    process.env.DATABASE__CONNECTION_TIMEOUT_MS = "12000";
    process.env.AUTH__ENABLED = "true";
    process.env.AUTH__BOOTSTRAP_ADMIN_EMAIL = "admin@example.com";
    process.env.AUTH__BOOTSTRAP_ADMIN_PASSWORD = "super-secret";
    process.env.AUTH__SESSION_SECRET = "0123456789abcdef0123456789abcdef";
    process.env.AUTH__SESSION_TTL_MS = "7200000";
    process.env.AUTH__SESSION_COOKIE_NAME = "litlocker-auth";
    process.env.AUTH__SESSION_COOKIE_SECURE = "true";
    process.env.AUTH__OIDC__ISSUER_URL = "https://id.example.com";
    process.env.AUTH__OIDC__CLIENT_ID = "litlocker-web";
    process.env.AUTH__OIDC__CLIENT_SECRET = "top-secret";
    process.env.AUTH__OIDC__REDIRECT_URL = "https://library.example.com/auth/callback";
    process.env.AUTH__OIDC__POST_LOGOUT_REDIRECT_URL = "https://library.example.com";
    process.env.AUTH__OIDC__SCOPES = "openid,profile,email,offline_access";
    process.env.AUTH__OIDC__REQUIRE_PKCE = "false";
    process.env.AUTH__OIDC__DISCOVERY_TIMEOUT_MS = "9000";
    process.env.METADATA_PROVIDERS__ENABLED_PROVIDERS = "open-library,google-books";
    process.env.METADATA_PROVIDERS__LOOKUP_TIMEOUT_MS = "8000";
    process.env.METADATA_PROVIDERS__DEFAULT_LANGUAGE = "sv";

    expect(createConfigStaticEnv()).toEqual({
      logger: {
        debugLogsEnabled: true,
        defaultMetadata: { service: "litlocker-server" },
      },
      server: {
        http: {
          address: "http://0.0.0.0:4000",
          timeoutMs: 12000,
          port: 4000,
        },
      },
      storage: {
        paths: {
          library: "/srv/litlocker/library",
          imports: "/srv/litlocker/imports",
          covers: "/srv/litlocker/covers",
        },
      },
      imports: {
        maxFileSizeInBytes: 250_000_000,
        allowedFileExtensions: ["epub", "pdf"],
        duplicateCheckEnabled: false,
      },
      database: {
        host: "postgres.internal",
        port: 25_432,
        user: "litlocker",
        password: "db-secret",
        database: "litlocker",
        schema: "litlocker_app",
        sslEnabled: true,
        poolMaxConnections: 20,
        poolIdleTimeoutMs: 45_000,
        connectionTimeoutMs: 12_000,
      },
      auth: {
        enabled: true,
        bootstrapAdminEmail: "admin@example.com",
        bootstrapAdminPassword: "super-secret",
        sessionSecret: "0123456789abcdef0123456789abcdef",
        sessionTtlMs: 7_200_000,
        sessionCookieName: "litlocker-auth",
        sessionCookieSecure: true,
        oidc: {
          issuerUrl: "https://id.example.com",
          clientId: "litlocker-web",
          clientSecret: "top-secret",
          redirectUrl: "https://library.example.com/auth/callback",
          postLogoutRedirectUrl: "https://library.example.com",
          scopes: ["openid", "profile", "email", "offline_access"],
          requirePkce: false,
          discoveryTimeoutMs: 9_000,
        },
      },
      metadataProviders: {
        enabledProviders: ["open-library", "google-books"],
        lookupTimeoutMs: 8_000,
        defaultLanguage: "sv",
      },
    });
  });

  it("should throw when auth is enabled without the required oidc settings", () => {
    process.env.AUTH__ENABLED = "true";

    expect(() => createConfigStaticEnv()).toThrow(
      "Invalid configuration: /auth/oidc/issuerUrl must NOT have fewer than 1 characters",
    );
  });

  it("should throw when env values produce an invalid config type", () => {
    process.env.AUTH__SESSION_COOKIE_SECURE = "maybe";

    expect(() => createConfigStaticEnv()).toThrow(
      "Invalid configuration: /auth/sessionCookieSecure must be boolean",
    );
  });

  it("should throw when the auth session secret is too short", () => {
    process.env.AUTH__SESSION_SECRET = "too-short";

    expect(() => createConfigStaticEnv()).toThrow(
      "Invalid configuration: /auth/sessionSecret must NOT have fewer than 32 characters",
    );
  });
});
