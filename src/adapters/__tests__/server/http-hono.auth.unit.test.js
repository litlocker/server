import { afterEach, describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import {
  createApplicationMock,
  createExpectedErrorResponse,
  createLoggerMock,
} from "./test-helpers.js";

const {
  initOidcAuthMiddlewareMock,
  oidcAuthMiddlewareMock,
  processOAuthCallbackMock,
  revokeSessionMock,
} = vi.hoisted(() => ({
  initOidcAuthMiddlewareMock: vi.fn(),
  oidcAuthMiddlewareMock: vi.fn(),
  processOAuthCallbackMock: vi.fn(),
  revokeSessionMock: vi.fn(),
}));

vi.mock("@hono/oidc-auth", () => ({
  initOidcAuthMiddleware: initOidcAuthMiddlewareMock,
  oidcAuthMiddleware: oidcAuthMiddlewareMock,
  processOAuthCallback: processOAuthCallbackMock,
  revokeSession: revokeSessionMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * @returns {import("../../../application/interfaces/result.js").SuccessResult<
 *   import("../../../application/interfaces/result.js").HealthStatus
 * >}
 */
const createHealthSuccessResult = () => {
  return {
    success: true,
    data: {
      status: "ok",
      details: {},
    },
  };
};

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

describe("hono auth middleware", () => {
  it("should leave /health public while protecting application routes when auth is enabled", async () => {
    initOidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response>|Promise<Response>|Response|undefined} next
       */
      async (_c, next) => next(),
    );
    oidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} c
       */
      async (c) => {
        return c.redirect("https://id.example.com/authorize", 302);
      },
    );

    const application = createApplicationMock({
      health: vi.fn(createHealthSuccessResult),
      listBooks: vi.fn(() => []),
    });
    const logger = createLoggerMock();
    const app = createHonoApp({
      application,
      authConfig,
      config: serverConfig,
      logger,
    });

    const healthResponse = await app.request("http://localhost/health");
    const openApiResponse = await app.request("http://localhost/openapi.yaml");
    const docsResponse = await app.request("http://localhost/docs");
    const booksResponse = await app.request("http://localhost/books");

    expect(healthResponse.status).toBe(200);
    expect(openApiResponse.status).toBe(200);
    expect(openApiResponse.headers.get("content-type")).toBe("application/yaml; charset=utf-8");
    expect(docsResponse.status).toBe(200);
    expect(booksResponse.status).toBe(302);
    expect(booksResponse.headers.get("location")).toBe("https://id.example.com/authorize");
    expect(logger.info).toHaveBeenCalledWith("OIDC middleware handled request", {
      domain: "auth",
      operation: "protect_route",
      path: "/books",
      statusCode: 302,
    });
    expect(initOidcAuthMiddlewareMock).toHaveBeenCalledWith({
      OIDC_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
      OIDC_AUTH_EXPIRES: "86400",
      OIDC_ISSUER: "https://id.example.com",
      OIDC_CLIENT_ID: "litlocker-web",
      OIDC_CLIENT_SECRET: "super-secret",
      OIDC_REDIRECT_URI: "https://library.example.com/auth/callback",
      OIDC_SCOPES: "openid profile email",
      OIDC_COOKIE_NAME: "litlocker-session",
      OIDC_COOKIE_PATH: "/",
      OIDC_AUTH_EXTERNAL_URL: "https://library.example.com",
    });
  });

  it("should allow authenticated requests to reach protected routes", async () => {
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

    /** @type {import("../../../application/entities/book.js").Book[]} */
    const books = [
      {
        id: "book-1",
        title: "The Left Hand of Darkness",
        subtitle: "",
        description: "",
        language: "",
        authors: [],
        tags: [],
        seriesName: "",
        seriesNumber: "",
        cover: {
          sourcePath: "",
          thumbnailPath: "",
          mimeType: "",
          dominantColor: "",
        },
        identifiers: {
          isbn10: "",
          isbn13: "",
          asin: "",
          goodreadsId: "",
          googleBooksId: "",
        },
        filePath: "",
        libraryStatus: "draft",
        readingStatus: "unread",
      },
    ];
    const application = createApplicationMock({
      listBooks: vi.fn(() => books),
    });
    const app = createHonoApp({
      application,
      authConfig,
      config: serverConfig,
      logger: createLoggerMock(),
    });

    const response = await app.request("http://localhost/books");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      books,
    });
    expect(application.listBooks).toHaveBeenCalledWith({
      filters: undefined,
    });
  });

  it("should surface invalid session handling from the oidc middleware", async () => {
    initOidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response> | Promise<Response> | Response | undefined} next
       */
      async (_c, next) => next(),
    );
    oidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} c
       */
      async (c) => {
        return c.json(
          {
            message: "Invalid session",
          },
          401,
        );
      },
    );

    const application = createApplicationMock({
      listBooks: vi.fn(() => []),
    });
    const app = createHonoApp({
      application,
      authConfig,
      config: serverConfig,
      logger: createLoggerMock(),
    });

    const response = await app.request("http://localhost/books");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid session",
    });
    expect(application.listBooks).not.toHaveBeenCalled();
  });

  it("should expose the callback and logout handlers when auth is enabled", async () => {
    initOidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response>|Promise<Response>|Response|undefined} next
       */
      async (_c, next) => next(),
    );
    oidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response>|Promise<Response>|Response|undefined} next
       */
      async (_c, next) => next(),
    );
    processOAuthCallbackMock.mockResolvedValue(new Response(null, { status: 302 }));
    revokeSessionMock.mockResolvedValue(undefined);

    const logger = createLoggerMock();
    const app = createHonoApp({
      application: createApplicationMock(),
      authConfig,
      config: serverConfig,
      logger,
    });

    const callbackResponse = await app.request(
      "http://localhost/auth/callback?code=test&state=state-1",
    );
    const logoutResponse = await app.request("http://localhost/auth/logout", {
      method: "POST",
    });

    expect(callbackResponse.status).toBe(302);
    expect(logoutResponse.status).toBe(200);
    expect(processOAuthCallbackMock).toHaveBeenCalledTimes(1);
    expect(revokeSessionMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith("OIDC callback request received", {
      domain: "auth",
      operation: "callback_request",
      path: "/auth/callback",
    });
    expect(logger.info).toHaveBeenCalledWith("OIDC callback request completed", {
      domain: "auth",
      operation: "callback_request",
      path: "/auth/callback",
      statusCode: 302,
    });
    expect(logger.info).toHaveBeenCalledWith("OIDC logout request received", {
      domain: "auth",
      operation: "logout_request",
      path: "/auth/logout",
    });
    expect(logger.info).toHaveBeenCalledWith("OIDC logout request completed", {
      domain: "auth",
      operation: "logout_request",
      path: "/auth/logout",
      statusCode: 200,
    });
  });

  it("should rate limit auth routes", async () => {
    initOidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response>|Promise<Response>|Response|undefined} next
       */
      async (_c, next) => next(),
    );
    oidcAuthMiddlewareMock.mockReturnValue(
      /**
       * @param {any} _c
       * @param {() => Promise<Response>|Promise<Response>|Response|undefined} next
       */
      async (_c, next) => next(),
    );
    processOAuthCallbackMock.mockResolvedValue(new Response(null, { status: 302 }));

    const logger = createLoggerMock();
    const app = createHonoApp({
      application: createApplicationMock(),
      authConfig: {
        ...authConfig,
        rateLimit: {
          windowMs: 60_000,
          maxRequests: 1,
        },
      },
      config: serverConfig,
      logger,
    });

    const firstResponse = await app.request(
      "http://localhost/auth/callback?code=test&state=state-1",
      {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      },
    );
    const secondResponse = await app.request(
      "http://localhost/auth/callback?code=test&state=state-2",
      {
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      },
    );

    expect(firstResponse.status).toBe(302);
    expect(secondResponse.status).toBe(429);
    await expect(secondResponse.json()).resolves.toEqual(
      createExpectedErrorResponse({
        code: "auth_rate_limit_exceeded",
        message: "Authentication rate limit exceeded",
        details: {
          area: "auth",
          maxRequests: 1,
          windowMs: 60_000,
        },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith("HTTP rate limit exceeded", {
      domain: "http",
      operation: "rate_limit",
      path: "/auth/callback",
      method: "GET",
      area: "auth",
    });
  });
});
