/**
 * @import { CreateIdGenerator } from "../../../application/interfaces/id-generator.js";
 */

/** @type { CreateIdGenerator } */
const createIdGeneratorSystem = () => {
  return {
    generate: () => crypto.randomUUID(),
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

export { createIdGeneratorSystem };
