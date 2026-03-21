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
    delete process.env.AUTH__ENABLED;
    delete process.env.AUTH__BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.AUTH__BOOTSTRAP_ADMIN_PASSWORD;
    delete process.env.AUTH__SESSION_TTL_MS;
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
      auth: {
        enabled: false,
        bootstrapAdminEmail: "",
        bootstrapAdminPassword: "",
        sessionTtlMs: 86_400_000,
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
    process.env.AUTH__ENABLED = "true";
    process.env.AUTH__BOOTSTRAP_ADMIN_EMAIL = "admin@example.com";
    process.env.AUTH__BOOTSTRAP_ADMIN_PASSWORD = "super-secret";
    process.env.AUTH__SESSION_TTL_MS = "7200000";
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
      auth: {
        enabled: true,
        bootstrapAdminEmail: "admin@example.com",
        bootstrapAdminPassword: "super-secret",
        sessionTtlMs: 7_200_000,
      },
      metadataProviders: {
        enabledProviders: ["open-library", "google-books"],
        lookupTimeoutMs: 8_000,
        defaultLanguage: "sv",
      },
    });
  });

  it("should throw when env values produce an invalid config", () => {
    process.env.AUTH__ENABLED = "maybe";

    expect(() => createConfigStaticEnv()).toThrow(
      "Invalid configuration: /auth/enabled must be boolean",
    );
  });
});
