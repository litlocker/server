import { runMetadataProviderUnitTests } from "../../../application/interfaces/test-runners/metadata-provider.unit.test-runner.js";
import { createMetadataProviderStatic } from "../../metadata-provider/static/index.js";

runMetadataProviderUnitTests(createMetadataProviderStatic);
