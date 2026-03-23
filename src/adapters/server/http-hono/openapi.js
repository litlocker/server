import { readFileSync } from "node:fs";

const OPENAPI_DOCUMENT = readFileSync(new URL("../../../../openapi.yaml", import.meta.url), "utf8");

export { OPENAPI_DOCUMENT };
