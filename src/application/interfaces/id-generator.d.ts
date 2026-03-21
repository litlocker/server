import { CheckHealth } from "./result.d.ts";

type Generate = () => string;

interface IdGenerator {
  generate: Generate;
  checkHealth: CheckHealth;
}

type CreateIdGenerator = () => IdGenerator;

export type { IdGenerator, CreateIdGenerator };
