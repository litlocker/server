import { afterEach, describe, expect, it, vi } from "vitest";

const { pinoFactoryMock, pinoInfoMock } = vi.hoisted(() => ({
  pinoFactoryMock: vi.fn(),
  pinoInfoMock: vi.fn(),
}));

vi.mock("pino", () => ({
  default: pinoFactoryMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("http hono request correlation", () => {
  it("should include the request id in application logs triggered during a request", async () => {
    pinoFactoryMock.mockReturnValue({
      debug: vi.fn(),
      info: pinoInfoMock,
      warn: vi.fn(),
      error: vi.fn(),
    });

    const { createApplication } = await import("../../../application/index.js");
    const { createClockSystem } = await import("../../clock/system/index.js");
    const { createIdGeneratorSystem } = await import("../../id-generator/system/index.js");
    const { createLoggerPino } = await import("../../logger/pino/index.js");
    const { createMetadataProviderStatic } =
      await import("../../metadata-provider/static/index.js");
    const { createPersistenceInMemory } = await import("../../persistence/in-memory/index.js");
    const { createHonoApp } = await import("../../server/http-hono/app.js");

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
        uploadRateLimit: {
          windowMs: 60_000,
          maxRequests: 10,
        },
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
        rateLimit: {
          windowMs: 60_000,
          maxRequests: 10,
        },
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
    const logger = createLoggerPino({ config: config.logger });
    const application = createApplication({
      clock: createClockSystem(),
      config,
      metadataProvider: createMetadataProviderStatic({ logger }),
      persistence: createPersistenceInMemory(),
      idGenerator: createIdGeneratorSystem(),
      logger,
    });
    const app = createHonoApp({
      application,
      config: config.server,
      logger,
    });

    const response = await app.request(
      new Request("http://localhost/imports", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "request-123",
        },
        body: JSON.stringify({
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(pinoInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: "test",
        requestId: "request-123",
      }),
      expect.any(String),
    );
    expect(pinoInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: "test",
        requestId: "request-123",
        domain: "import",
        operation: "create_import_job",
      }),
      "Import job created",
    );
  });
});
