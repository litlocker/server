/**
 * @import { Application } from "../../../application/interface.js";
 * @import { Config } from "../../../application/interfaces/config.js";
 * @import { Logger } from "../../../application/interfaces/logger.js";
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as requestLogger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { createRouters } from "./router/index.js";

/**
 * @param { object } params
 * @param { Application } params.application
 * @param { Config['server'] } params.config
 * @param { Logger } params.logger
 */
const createHonoApp = ({ application, config, logger }) => {
  const app = new Hono();

  const { healthRouter, booksRouter, shelvesRouter } = createRouters({ application });

  app
    .use(cors({ origin: "*" }))
    .use(secureHeaders())
    .use(requestId())
    .use(prettyJSON())
    .use(requestLogger(logger.info))
    .use(timeout(config.http.timeoutMs));

  app.route("/health", healthRouter);
  app.route("/books", booksRouter);
  app.route("/shelves", shelvesRouter);

  return app;
};

export { createHonoApp };
