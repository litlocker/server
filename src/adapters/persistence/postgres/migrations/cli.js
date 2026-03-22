import { createConfigStaticEnv } from "../../../config/static-env/index.js";
import { createLoggerPino } from "../../../logger/pino/index.js";
import { runPostgresMigrations } from "./index.js";

const directionArgument = process.argv[2];
const countArgument = process.argv[3];

if (directionArgument !== "up" && directionArgument !== "down") {
  console.error(
    "Usage: node ./src/adapters/persistence/postgres/migrations/cli.js <up|down> [count]",
  );
  process.exit(1);
}

const parsedCount = Number.parseInt(countArgument ?? "", 10);
const count =
  Number.isFinite(parsedCount) && parsedCount > 0
    ? parsedCount
    : directionArgument === "down"
      ? 1
      : Number.POSITIVE_INFINITY;

const config = createConfigStaticEnv();
const logger = createLoggerPino({ config: config.logger });

runPostgresMigrations({
  config,
  direction: directionArgument,
  count,
  logger,
})
  .then(() => {
    logger.info("Postgres migrations completed", { direction: directionArgument, count });
  })
  .catch((error) => {
    logger.error("Postgres migrations failed", { error });
    process.exit(1);
  });
