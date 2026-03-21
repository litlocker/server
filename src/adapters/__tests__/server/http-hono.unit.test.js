import { runServerUnitTests } from "../../../application/interfaces/test-runners/server.unit.test-runner.js";
import { createServerHttpHono } from "../../server/http-hono/index.js";

runServerUnitTests(createServerHttpHono);
