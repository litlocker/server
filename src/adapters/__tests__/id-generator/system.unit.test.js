import { runIdGeneratorUnitTests } from "../../../application/interfaces/test-runners/id-generator.unit.test-runner.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";

runIdGeneratorUnitTests(createIdGeneratorSystem);
