import { createClockSystem } from "./adapters/clock/system/index.js";
import { createConfigStaticEnv } from "./adapters/config/static-env/index.js";
import { createDataStoreInMemory } from "./adapters/data-store/in-memory/index.js";
import { createLoggerPino } from "./adapters/logger/pino/index.js";
import { createServerHttpHono } from "./adapters/server/http-hono/index.js";
import { createApplication } from "./application/index.js";

const boot = () => {
  const clock = createClockSystem();
  const config = createConfigStaticEnv();
  const logger = createLoggerPino({ config: config.logger });
  const dataStore = createDataStoreInMemory();

  const application = createApplication({ clock, config, dataStore, logger });

  const server = createServerHttpHono({ application, config: config.server, logger });

  return {
    clock,
    config,
    dataStore,
    logger,
    application,
    server,
  };
};

export { boot };
