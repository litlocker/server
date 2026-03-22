/**
 * @import { Application } from "../../../application/interface.js";
 * @import { AuthConfig, Config } from "../../../application/interfaces/config.js";
 * @import { Logger } from "../../../application/interfaces/logger.js";
 */

import {
  initOidcAuthMiddleware,
  oidcAuthMiddleware,
  processOAuthCallback,
  revokeSession,
} from "@hono/oidc-auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as requestLogger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { runWithLogContext } from "../../logger/request-context/index.js";
import { respondWithInternalError } from "./router/http-error-response.js";
import { createRouters } from "./router/index.js";

/**
 * @param { object } params
 * @param { Application } params.application
 * @param { Config['server'] } params.config
 * @param { AuthConfig } [params.authConfig]
 * @param { Logger } params.logger
 */
const createHonoApp = ({ application, authConfig, config, logger }) => {
  const app = new Hono();
  const isAuthEnabled = authConfig?.enabled ?? false;

  const { healthRouter, booksRouter, importsRouter, progressRouter, shelvesRouter } = createRouters(
    {
      application,
      authEnabled: isAuthEnabled,
      authIssuer: authConfig?.oidc.issuerUrl ?? "",
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
  }

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
      if (c.req.path === "/health" || c.req.path === "/auth/callback") {
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
