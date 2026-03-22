import { describe, expect, it } from "vitest";
import { createApplication } from "../../../application/index.js";
import { createClockSystem } from "../../clock/system/index.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";
import { createLoggerPino } from "../../logger/pino/index.js";
import { createPersistenceInMemory } from "../../persistence/in-memory/index.js";
import { createHonoApp } from "../../server/http-hono/app.js";

describe("http hono progress routes integration", () => {
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

  const createTestApp = () => {
    const clock = createClockSystem();
    const logger = createLoggerPino({ config: config.logger });
    const persistence = createPersistenceInMemory();
    const idGenerator = createIdGeneratorSystem();
    const application = createApplication({
      clock,
      config,
      persistence,
      idGenerator,
      logger,
    });

    const book = application.createBook({
      book: {
        title: "The Left Hand of Darkness",
      },
    });
    const user = persistence.users.create({
      record: {
        id: "user-1",
        authIssuer: "https://id.example.com",
        authSubject: "reader-123",
        email: "reader@example.com",
        emailVerified: true,
        displayName: "Reader",
        avatarUrl: "https://id.example.com/avatar/reader-123",
        role: "admin",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
      },
    });

    return {
      app: createHonoApp({
        application,
        config: config.server,
        logger,
      }),
      book,
      user,
    };
  };

  it("should save and retrieve reading progress through the API", async () => {
    const { app, book, user } = createTestApp();

    const saveResponse = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          userId: user.id,
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        }),
      }),
    );

    expect(saveResponse.status).toBe(201);
    const { progress: savedProgress } = await saveResponse.json();

    expect(savedProgress).toEqual({
      id: savedProgress.id,
      bookId: book.id,
      userId: user.id,
      format: "epub",
      locator: "epubcfi(/6/2[cover]!/4/1:0)",
      percentage: "0.25",
      createdAt: savedProgress.createdAt,
      updatedAt: savedProgress.updatedAt,
    });

    const getResponse = await app.request(`http://localhost/progress/${book.id}?userId=${user.id}`);

    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({
      progress: savedProgress,
    });
  });

  it("should reject invalid reader locators through the API", async () => {
    const { app, book, user } = createTestApp();

    const epubResponse = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          userId: user.id,
          format: "epub",
          locator: "page=12",
          percentage: "0.25",
        }),
      }),
    );

    expect(epubResponse.status).toBe(400);
    await expect(epubResponse.json()).resolves.toEqual({
      message: "Invalid progress payload",
      errors: ["/locator must be a valid EPUB CFI"],
    });

    const pdfResponse = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          userId: user.id,
          format: "pdf",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        }),
      }),
    );

    expect(pdfResponse.status).toBe(400);
    await expect(pdfResponse.json()).resolves.toEqual({
      message: "Invalid progress payload",
      errors: ["/locator must be a valid PDF page locator"],
    });

    const comicResponse = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          userId: user.id,
          format: "comic",
          locator: "page=12",
          percentage: "0.25",
        }),
      }),
    );

    expect(comicResponse.status).toBe(400);
    await expect(comicResponse.json()).resolves.toEqual({
      message: "Invalid progress payload",
      errors: ["/locator must be a valid comic image locator"],
    });
  });
});
