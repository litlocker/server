/**
 * @import { CreateApplication } from './interface.js'
 * @import { BookIdentifiers, CreateBookInput, UpdateBookInput } from './entities/book.js'
 */

/**
 * @param { Partial<BookIdentifiers> | undefined } identifiers
 * @returns { BookIdentifiers }
 */
const normalizeBookIdentifiers = (identifiers) => {
  return {
    isbn10: identifiers?.isbn10 ?? "",
    isbn13: identifiers?.isbn13 ?? "",
    asin: identifiers?.asin ?? "",
    goodreadsId: identifiers?.goodreadsId ?? "",
    googleBooksId: identifiers?.googleBooksId ?? "",
  };
};

/**
 * @param { CreateBookInput } book
 */
const normalizeBook = (book) => {
  return {
    title: book.title,
    subtitle: book.subtitle ?? "",
    description: book.description ?? "",
    language: book.language ?? "",
    identifiers: normalizeBookIdentifiers(book.identifiers),
    status: book.status ?? "draft",
  };
};

/**
 * @param { object } params
 * @param { ReturnType<import('./interfaces/data-store.js').DataStore['getBook']> extends infer T ? Exclude<T, null> : never } params.currentBook
 * @param { UpdateBookInput } params.updates
 */
const normalizeBookUpdates = ({ currentBook, updates }) => {
  return {
    title: updates.title ?? currentBook.title,
    subtitle: updates.subtitle ?? currentBook.subtitle ?? "",
    description: updates.description ?? currentBook.description ?? "",
    language: updates.language ?? currentBook.language ?? "",
    identifiers: updates.identifiers
      ? normalizeBookIdentifiers({ ...currentBook.identifiers, ...updates.identifiers })
      : currentBook.identifiers,
    status: updates.status ?? currentBook.status,
  };
};

/** @type { CreateApplication } */
const createApplication = ({ config: _config, dataStore, logger: _logger }) => {
  return {
    hello: ({ name }) => {
      return `Hello, ${name}!`;
    },
    createBook: ({ book }) => {
      return dataStore.createBook({ book: normalizeBook(book) });
    },
    updateBook: ({ id, updates }) => {
      const currentBook = dataStore.getBook({ id });

      if (!currentBook) {
        return null;
      }

      return dataStore.updateBook({
        id,
        updates: normalizeBookUpdates({ currentBook, updates }),
      });
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
