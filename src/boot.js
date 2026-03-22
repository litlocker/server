import { createClockSystem } from "./adapters/clock/system/index.js";
import { createConfigStaticEnv } from "./adapters/config/static-env/index.js";
import { createFileStorageLocalFilesystem } from "./adapters/file-storage/local-filesystem/index.js";
import { createIdGeneratorSystem } from "./adapters/id-generator/system/index.js";
import { createLoggerPino } from "./adapters/logger/pino/index.js";
import { createMetadataProviderStatic } from "./adapters/metadata-provider/static/index.js";
import { createPersistencePostgres } from "./adapters/persistence/postgres/index.js";
import { runPendingPostgresMigrations } from "./adapters/persistence/postgres/migrations/index.js";
import { createServerHttpHono } from "./adapters/server/http-hono/index.js";
import { createApplication } from "./application/index.js";
import { createRuntimeShutdown } from "./runtime/shutdown.js";

const boot = async () => {
  const clock = createClockSystem();
  const config = createConfigStaticEnv();
  const logger = createLoggerPino({ config: config.logger });
  await runPendingPostgresMigrations({ config, logger });
  const fileStorage = createFileStorageLocalFilesystem({ config, logger });
  const metadataProvider = createMetadataProviderStatic({ logger });
  const persistence = createPersistencePostgres({ config });
  const idGenerator = createIdGeneratorSystem();

  const application = createApplication({
    clock,
    config,
    fileStorage,
    metadataProvider,
    persistence,
    idGenerator,
    logger,
  });

  const server = createServerHttpHono({
    application,
    config: {
      server: config.server,
      auth: config.auth,
      imports: config.imports,
    },
    logger,
  });
  const shutdown = createRuntimeShutdown({
    logger,
    server,
    persistence,
  });

  return {
    clock,
    config,
    fileStorage,
    metadataProvider,
    persistence,
    idGenerator,
    logger,
    application,
    server,
    shutdown,
  };
};

export { boot };
