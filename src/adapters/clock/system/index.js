/**
 * @import { CreateClock } from "../../../application/interfaces/clock.js";
 */

/** @type { CreateClock } */
const createClockSystem = () => {
  return {
    now: () => new Date(),
  };
};

export { createClockSystem };
