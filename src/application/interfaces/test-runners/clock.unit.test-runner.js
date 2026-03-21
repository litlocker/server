/**
 * @import { CreateClock } from "../clock.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreateClock } createClock */
const runClockUnitTests = (createClock) => {
  describe("clock", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const clock = createClock();

        expect(clock).toHaveProperty("now");
        expect(clock).toHaveProperty("checkHealth");
      });
    });

    describe("functions", () => {
      it("should return a date from now()", () => {
        const clock = createClock();

        expect(clock.now()).toBeInstanceOf(Date);
      });

      it("should expose health status", () => {
        const clock = createClock();

        const result = clock.checkHealth();

        expect(result).toHaveProperty("success");
      });
    });
  });
};

export { runClockUnitTests };
