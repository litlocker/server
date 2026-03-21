import { CheckHealth } from "./result.d.ts";

type Now = () => Date;

interface Clock {
  now: Now;
  checkHealth: CheckHealth;
}

type CreateClock = () => Clock;

export type { Clock, CreateClock };
