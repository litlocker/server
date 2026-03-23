/**
 * @import { Application } from "../../../application/interface.js";
 * @import { AuthConfig, Config, ImportsConfig } from "../../../application/interfaces/config.js";
 * @import { Logger } from "../../../application/interfaces/logger.js";
 */

import {
  initOidcAuthMiddleware,
  oidcAuthMiddleware,
  processOAuthCallback,
  revokeSession,
} from "@hono/oidc-auth";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { cors } from "hono/cors";
import { logger as requestLogger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { runWithLogContext } from "../../logger/request-context/index.js";
import { OPENAPI_DOCUMENT } from "./openapi.js";
import { createErrorBody, respondWithInternalError } from "./router/http-error-response.js";
import { createRouters } from "./router/index.js";

/**
 * @param {import("hono").Context} context
 * @returns {string}
 */
const getRateLimitKey = (context) => {
  const forwardedFor = context.req.header("x-forwarded-for") || "";
  const forwardedAddress = forwardedFor.split(",")[0]?.trim() || "";
  const realIp = context.req.header("x-real-ip") || "";
  const connectingIp = context.req.header("cf-connecting-ip") || "";

  return forwardedAddress || realIp || connectingIp || "anonymous";
};

/**
 * @param {object} params
 * @param {Logger} params.logger
 * @param {string} params.code
 * @param {string} params.message
 * @param {Record<string, unknown>} params.details
 * @param {number} params.maxRequests
 * @param {number} params.windowMs
 * @param {(context: import("hono").Context) => boolean | Promise<boolean>} [params.skip]
 * @returns {import("hono").MiddlewareHandler}
 */
const createRateLimitMiddleware = ({
  logger,
  code,
  message,
  details,
  maxRequests,
  windowMs,
  skip,
}) => {
  return rateLimiter({
    limit: maxRequests,
    windowMs,
    standardHeaders: "draft-6",
    keyGenerator: getRateLimitKey,
    skip,
    handler: (context) => {
      logger.warn("HTTP rate limit exceeded", {
        domain: "http",
        operation: "rate_limit",
        path: context.req.path,
        method: context.req.method,
        ...details,
      });

      context.status(429);

      return context.json(
        createErrorBody({
          code,
          message,
          details: {
            ...details,
            maxRequests,
            windowMs,
          },
        }),
      );
    },
  });
};

/**
 * @param { object } params
 * @param { Application } params.application
 * @param { Config['server'] } params.config
 * @param { AuthConfig } [params.authConfig]
 * @param {ImportsConfig} [params.importsConfig]
 * @param { Logger } params.logger
 */
const createHonoApp = ({ application, authConfig, importsConfig, config, logger }) => {
  const app = new Hono();
  const isAuthEnabled = authConfig?.enabled ?? false;
  const publicPaths = new Set(["/health", "/openapi.yaml", "/docs", "/auth/callback"]);
  const authRateLimit = authConfig?.rateLimit ?? {
    windowMs: 60_000,
    maxRequests: 10,
  };
  const uploadRateLimit = importsConfig?.uploadRateLimit ?? {
    windowMs: 60_000,
    maxRequests: 10,
  };

  const { healthRouter, booksRouter, importsRouter, progressRouter, shelvesRouter } = createRouters(
    {
      application,
      authEnabled: isAuthEnabled,
      authIssuer: authConfig?.oidc.issuerUrl ?? "",
      importsConfig,
    },
  );

  app
    .use(cors({ origin: "*" }))
    .use(secureHeaders())
    .use(requestId())
    .use(async (c, next) => {
      return runWithLogContext({
        context: {
          requestId: c.get("requestId"),
        },
        callback: next,
      });
    })
    .use(prettyJSON())
    .use(requestLogger(logger.info))
    .use(timeout(config.http.timeoutMs));

  app.use(
    "/imports",
    createRateLimitMiddleware({
      logger,
      code: "upload_rate_limit_exceeded",
      message: "Upload rate limit exceeded",
      details: {
        area: "imports",
      },
      maxRequests: uploadRateLimit.maxRequests,
      windowMs: uploadRateLimit.windowMs,
      skip: (context) => {
        if (context.req.method !== "POST") {
          return true;
        }

        const contentType = context.req.header("content-type") || "";

        return !contentType.startsWith("multipart/form-data");
      },
    }),
  );

  if (isAuthEnabled && authConfig) {
    app.use(
      "*",
      initOidcAuthMiddleware({
        OIDC_AUTH_SECRET: authConfig.sessionSecret,
        OIDC_AUTH_EXPIRES: `${Math.floor(authConfig.sessionTtlMs / 1000)}`,
        OIDC_ISSUER: authConfig.oidc.issuerUrl,
        OIDC_CLIENT_ID: authConfig.oidc.clientId,
        OIDC_CLIENT_SECRET: authConfig.oidc.clientSecret,
        OIDC_REDIRECT_URI: authConfig.oidc.redirectUrl,
        OIDC_SCOPES: authConfig.oidc.scopes.join(" "),
        OIDC_COOKIE_NAME: authConfig.sessionCookieName,
        OIDC_COOKIE_PATH: "/",
        OIDC_AUTH_EXTERNAL_URL: config.http.address,
      }),
    );

    app.use(
      "/auth/*",
      createRateLimitMiddleware({
        logger,
        code: "auth_rate_limit_exceeded",
        message: "Authentication rate limit exceeded",
        details: {
          area: "auth",
        },
        maxRequests: authRateLimit.maxRequests,
        windowMs: authRateLimit.windowMs,
      }),
    );
  }

  app.get("/openapi.yaml", () => {
    return new Response(OPENAPI_DOCUMENT, {
      status: 200,
      headers: {
        "content-type": "application/yaml; charset=utf-8",
      },
    });
  });

  app.get(
    "/docs",
    Scalar({
      url: "/openapi.yaml",
      pageTitle: "LitLocker API Reference",
      documentDownloadType: "yaml",
      telemetry: false,
    }),
  );

  app.route("/health", healthRouter);

  if (isAuthEnabled) {
    app.get("/auth/callback", async (c) => {
      logger.info("OIDC callback request received", {
        domain: "auth",
        operation: "callback_request",
        path: c.req.path,
      });
      const response = await processOAuthCallback(c);
      logger.info("OIDC callback request completed", {
        domain: "auth",
        operation: "callback_request",
        path: c.req.path,
        statusCode: response.status,
      });

      return response;
    });

    app.post("/auth/logout", async (c) => {
      logger.info("OIDC logout request received", {
        domain: "auth",
        operation: "logout_request",
        path: c.req.path,
      });
      await revokeSession(c);
      logger.info("OIDC logout request completed", {
        domain: "auth",
        operation: "logout_request",
        path: c.req.path,
        statusCode: 200,
      });

      return c.json({ success: true });
    });

    app.use("*", async (c, next) => {
      if (publicPaths.has(c.req.path)) {
        return next();
      }

      const response = await oidcAuthMiddleware()(c, next);

      if (response instanceof Response && response.status >= 300) {
        logger.info("OIDC middleware handled request", {
          domain: "auth",
          operation: "protect_route",
          path: c.req.path,
          statusCode: response.status,
        });
      }

      return response;
    });
  }

  app.route("/books", booksRouter);
  app.route("/imports", importsRouter);
  app.route("/progress", progressRouter);
  app.route("/shelves", shelvesRouter);
  app.onError((error, c) => {
    return respondWithInternalError({
      context: c,
      logger,
      error,
    });
  });

  return app;
};

export { createHonoApp };
