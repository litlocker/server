import { createConfigStaticEnv } from "./adapters/config/static-env/index.js";
import { createDataStoreInMemory } from "./adapters/data-store/in-memory/index.js";
import { createLoggerPino } from "./adapters/logger/pino/index.js";
import { createServerHttpHono } from "./adapters/server/http-hono/index.js";
import { createApplication } from "./application/index.js";

const boot = () => {
  const config = createConfigStaticEnv();
  const logger = createLoggerPino({ config: config.logger });
  const dataStore = createDataStoreInMemory();

  const application = createApplication({ config, dataStore, logger });

  const server = createServerHttpHono({ application, config: config.server, logger });

  return {
    config,
    dataStore,
    logger,
    application,
    server,
  };
};

export { boot };
