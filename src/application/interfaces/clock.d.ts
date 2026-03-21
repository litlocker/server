type Now = () => Date;

interface Clock {
  now: Now;
}

type CreateClock = () => Clock;

export type { Clock, CreateClock };
