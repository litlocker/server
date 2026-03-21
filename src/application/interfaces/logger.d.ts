import { Config } from "./config.d.ts";

type LogFn = (message: string, ...args: any[]) => void;

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

interface Deps {
  config: Config["logger"];
}
type CreateLogger = (deps: Deps) => Logger;

export type { Logger, CreateLogger };
