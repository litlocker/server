import { runClockUnitTests } from "../../../application/interfaces/test-runners/clock.unit.test-runner.js";
import { createClockSystem } from "../../clock/system/index.js";

runClockUnitTests(createClockSystem);
