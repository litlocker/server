/**
 * @import { CreateIdGenerator } from "../id-generator.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreateIdGenerator } createIdGenerator */
const runIdGeneratorUnitTests = (createIdGenerator) => {
  describe("id generator", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const idGenerator = createIdGenerator();

        expect(idGenerator).toHaveProperty("generate");
      });
    });

    describe("functions", () => {
      it("should return a non-empty string from generate()", () => {
        const idGenerator = createIdGenerator();
        const id = idGenerator.generate();

        expect(id).toEqual(expect.any(String));
        expect(id.length).toBeGreaterThan(0);
      });
    });
  });
};

export { runIdGeneratorUnitTests };
