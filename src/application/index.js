/**
 * @import { CreateApplication } from './interface.js'
 */

/** @type { CreateApplication } */
const createApplication = ({ config, logger }) => {
  return {
    hello: ({ name }) => {
      return `Hello, ${name}!`;
    },
  };
};

export { createApplication };
