import { createConfigStaticEnv } from "./adapters/config/static-env/index.js";
import { createLoggerPino } from "./adapters/logger/pino/index.js";
import { createServerHttpHono } from "./adapters/server/http-hono/index.js";
import { createApplication } from "./application/index.js";

const boot = () => {
  const config = createConfigStaticEnv();
  const logger = createLoggerPino({ config: config.logger });

  const application = createApplication({ config, logger });

  const server = createServerHttpHono({ application, config: config.server, logger });

  return {
    config,
    logger,
    application,
    server,
  };
};

export { boot };
