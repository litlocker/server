/**
 * @import { CreateClock } from "../../../application/interfaces/clock.js";
 */

/** @type { CreateClock } */
const createClockSystem = () => {
  return {
    now: () => new Date(),
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

export { createClockSystem };
