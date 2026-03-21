import { runPersistenceUnitTests } from "../../../application/interfaces/test-runners/persistence.unit.test-runner.js";
import { createPersistenceInMemory } from "../../persistence/in-memory/index.js";

runPersistenceUnitTests(createPersistenceInMemory);
