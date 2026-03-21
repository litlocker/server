/**
 * @import { CreateDataStore } from "../../../application/interfaces/data-store.js";
 */

/** @type { CreateDataStore } */
const createDataStoreInMemory = () => {
  const books = new Map();

  return {
    createBook: ({ book }) => {
      const nextBook = {
        id: crypto.randomUUID(),
        ...book,
      };

      books.set(nextBook.id, nextBook);

      return nextBook;
    },
    updateBook: ({ id, updates }) => {
      const currentBook = books.get(id);

      if (!currentBook) {
        return null;
      }

      const nextBook = {
        ...currentBook,
        ...updates,
        id,
      };

      books.set(id, nextBook);

      return nextBook;
    },
    listBooks: () => {
      return Array.from(books.values());
    },
    getBook: ({ id }) => {
      return books.get(id) ?? null;
    },
  };
};

export { createDataStoreInMemory };
