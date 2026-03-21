/**
 * @import { CreateApplication } from './interface.js'
 */

/** @type { CreateApplication } */
const createApplication = ({ config: _config, dataStore, logger: _logger }) => {
  return {
    hello: ({ name }) => {
      return `Hello, ${name}!`;
    },
    createBook: ({ book }) => {
      return dataStore.createBook({ book });
    },
    updateBook: ({ id, updates }) => {
      return dataStore.updateBook({ id, updates });
    },
    listBooks: () => {
      return dataStore.listBooks();
    },
    getBook: ({ id }) => {
      return dataStore.getBook({ id });
    },
  };
};

export { createApplication };
