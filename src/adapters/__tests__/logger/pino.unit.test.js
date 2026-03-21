import { runLoggerUnitTests } from "../../../application/interfaces/test-runners/logger.unit.test-runner.js";
import { createLoggerPino } from "../../logger/pino/index.js";

runLoggerUnitTests(createLoggerPino);
