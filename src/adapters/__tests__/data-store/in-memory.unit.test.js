import { runDataStoreUnitTests } from "../../../application/interfaces/test-runners/data-store.unit.test-runner.js";
import { createDataStoreInMemory } from "../../data-store/in-memory/index.js";

runDataStoreUnitTests(createDataStoreInMemory);
