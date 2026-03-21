/**
 * @import { CreateIdGenerator } from "../../../application/interfaces/id-generator.js";
 */

/** @type { CreateIdGenerator } */
const createIdGeneratorSystem = () => {
  return {
    generate: () => crypto.randomUUID(),
  };
};

export { createIdGeneratorSystem };
