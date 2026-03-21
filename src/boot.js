import { createClockSystem } from "./adapters/clock/system/index.js";
import { createConfigStaticEnv } from "./adapters/config/static-env/index.js";
import { createDataStoreInMemory } from "./adapters/data-store/in-memory/index.js";
import { createIdGeneratorSystem } from "./adapters/id-generator/system/index.js";
import { createLoggerPino } from "./adapters/logger/pino/index.js";
import { createServerHttpHono } from "./adapters/server/http-hono/index.js";
import { createApplication } from "./application/index.js";

const boot = () => {
  const clock = createClockSystem();
  const config = createConfigStaticEnv();
  const logger = createLoggerPino({ config: config.logger });
  const dataStore = createDataStoreInMemory();
  const idGenerator = createIdGeneratorSystem();

  const application = createApplication({ clock, config, dataStore, idGenerator, logger });

  const server = createServerHttpHono({ application, config: config.server, logger });

  return {
    clock,
    config,
    dataStore,
    idGenerator,
    logger,
    application,
    server,
  };
};

export { boot };
