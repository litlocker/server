import { Config } from "./interfaces/config.d.ts";
import { Logger } from "./interfaces/logger.d.ts";

type Hello = ({ name }: { name: string }) => string;

interface Application {
  hello: Hello;
}

interface Deps {
  config: Config;
  logger: Logger;
}

type CreateApplication = (deps: Deps) => Application;

export type { Application, CreateApplication };
