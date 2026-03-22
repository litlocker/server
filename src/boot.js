import { createClockSystem } from "./adapters/clock/system/index.js";
import { createConfigStaticEnv } from "./adapters/config/static-env/index.js";
import { createFileStorageLocalFilesystem } from "./adapters/file-storage/local-filesystem/index.js";
import { createIdGeneratorSystem } from "./adapters/id-generator/system/index.js";
import { createLoggerPino } from "./adapters/logger/pino/index.js";
import { createPersistenceInMemory } from "./adapters/persistence/in-memory/index.js";
import { createServerHttpHono } from "./adapters/server/http-hono/index.js";
import { createApplication } from "./application/index.js";

const boot = () => {
  const clock = createClockSystem();
  const config = createConfigStaticEnv();
  const fileStorage = createFileStorageLocalFilesystem({ config });
  const logger = createLoggerPino({ config: config.logger });
  const persistence = createPersistenceInMemory();
  const idGenerator = createIdGeneratorSystem();

  const application = createApplication({
    clock,
    config,
    fileStorage,
    persistence,
    idGenerator,
    logger,
  });

  const server = createServerHttpHono({ application, config: config.server, logger });

  return {
    clock,
    config,
    fileStorage,
    persistence,
    idGenerator,
    logger,
    application,
    server,
  };
};

export { boot };
