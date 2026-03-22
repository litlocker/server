import { afterEach, describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import {
  createApplicationMock,
  createExpectedErrorResponse,
  createLoggerMock,
} from "./test-helpers.js";

const { getAuthMock, initOidcAuthMiddlewareMock, oidcAuthMiddlewareMock } = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
  initOidcAuthMiddlewareMock: vi.fn(),
  oidcAuthMiddlewareMock: vi.fn(),
}));

vi.mock("@hono/oidc-auth", () => ({
  getAuth: getAuthMock,
  initOidcAuthMiddleware: initOidcAuthMiddlewareMock,
  oidcAuthMiddleware: oidcAuthMiddlewareMock,
  processOAuthCallback: vi.fn(),
  revokeSession: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const authConfig = {
  enabled: true,
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
    issuerUrl: "https://id.example.com",
    clientId: "litlocker-web",
    clientSecret: "super-secret",
    redirectUrl: "https://library.example.com/auth/callback",
    postLogoutRedirectUrl: "https://library.example.com",
    scopes: ["openid", "profile", "email"],
    requirePkce: true,
    discoveryTimeoutMs: 5_000,
  },
};

const serverConfig = {
  http: {
    address: "https://library.example.com",
    port: 3000,
    timeoutMs: 1000,
  },
};

describe("http hono progress routes with auth", () => {
  it("should save reading progress for the current authenticated user", async () => {
    initOidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response> | Promise<Response> | Response | undefined} next
       */
      async (_c, next) => next(),
    );
    oidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response> | Promise<Response> | Response | undefined} next
       */
      async (_c, next) => next(),
    );
    getAuthMock.mockResolvedValue({
      sub: "reader-123",
      email: "reader@example.com",
      email_verified: true,
      name: "Reader",
      picture: "https://id.example.com/avatar/reader-123",
    });

    const progress = {
      id: "progress-1",
      bookId: "book-1",
      userId: "user-1",
      format: "epub",
      locator: "epubcfi(/6/2[cover]!/4/1:0)",
      percentage: "0.25",
      createdAt: "2026-03-22T12:00:00.000Z",
      updatedAt: "2026-03-22T12:00:00.000Z",
    };
    const application = createApplicationMock({
      saveCurrentUserReadingProgress: vi.fn().mockReturnValue(progress),
      getCurrentUserReadingProgress: vi.fn().mockReturnValue(progress),
    });
    const app = createHonoApp({
      application,
      authConfig,
      config: serverConfig,
      logger: createLoggerMock(),
    });

    const saveResponse = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: "book-1",
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        }),
      }),
    );

    expect(saveResponse.status).toBe(201);
    await expect(saveResponse.json()).resolves.toEqual({
      progress,
    });
    expect(application.saveCurrentUserReadingProgress).toHaveBeenCalledWith({
      currentUser: {
        authIssuer: "https://id.example.com",
        authSubject: "reader-123",
        email: "reader@example.com",
        emailVerified: true,
        displayName: "Reader",
        avatarUrl: "https://id.example.com/avatar/reader-123",
      },
      progress: {
        bookId: "book-1",
        format: "epub",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
      },
    });

    const getResponse = await app.request("http://localhost/progress/book-1");

    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({
      progress,
    });
    expect(application.getCurrentUserReadingProgress).toHaveBeenCalledWith({
      currentUser: {
        authIssuer: "https://id.example.com",
        authSubject: "reader-123",
        email: "reader@example.com",
        emailVerified: true,
        displayName: "Reader",
        avatarUrl: "https://id.example.com/avatar/reader-123",
      },
      bookId: "book-1",
    });
  });

  it("should return 404 when the current authenticated user has no reading progress", async () => {
    initOidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response> | Promise<Response> | Response | undefined} next
       */
      async (_c, next) => next(),
    );
    oidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response> | Promise<Response> | Response | undefined} next
       */
      async (_c, next) => next(),
    );
    getAuthMock.mockResolvedValue({
      sub: "reader-123",
      email: "reader@example.com",
    });

    const application = createApplicationMock({
      getCurrentUserReadingProgress: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({
      application,
      authConfig,
      config: serverConfig,
      logger: createLoggerMock(),
    });

    const response = await app.request("http://localhost/progress/book-1");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "reading_progress_not_found",
        message: "Reading progress not found",
        details: {
          bookId: "book-1",
        },
      }),
    });
  });
});
