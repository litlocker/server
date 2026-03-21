import { Config } from "./config.d.ts";
import { Logger } from "./logger.d.ts";
import { CheckHealth } from "./result.d.ts";

interface Result {
  success: boolean;
}

type ServerStartFn = () => Promise<Result>;
type ServerStopFn = ({ reason }: { reason: Record<string, unknown> }) => Promise<Result>;

interface Server {
  start: ServerStartFn;
  stop: ServerStopFn;
  checkHealth: CheckHealth;
}

interface Deps {
  application: Application;
  config: Config["server"];
  logger: Logger;
}
type CreateServer = (deps: Deps) => Server;

export type { Server, CreateServer };
