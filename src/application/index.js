/**
 * @import { CreateApplication } from './interface.js'
 * @import { BookCover, BookIdentifiers, CreateBookInput, UpdateBookInput } from './entities/book.js'
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
 * @param { string[] | undefined } authors
 * @returns { string[] }
 */
const normalizeBookAuthors = (authors) => {
  return authors ? [...authors] : [];
};

/**
 * @param { string[] | undefined } tags
 * @returns { string[] }
 */
const normalizeBookTags = (tags) => {
  return tags ? [...tags] : [];
};

/**
 * @param { Partial<BookCover> | undefined } cover
 * @returns { BookCover }
 */
const normalizeBookCover = (cover) => {
  return {
    sourcePath: cover?.sourcePath ?? "",
    thumbnailPath: cover?.thumbnailPath ?? "",
    mimeType: cover?.mimeType ?? "",
    dominantColor: cover?.dominantColor ?? "",
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
    authors: normalizeBookAuthors(book.authors),
    tags: normalizeBookTags(book.tags),
    seriesName: book.seriesName ?? "",
    seriesNumber: book.seriesNumber ?? "",
    cover: normalizeBookCover(book.cover),
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
    authors: updates.authors ?? currentBook.authors,
    tags: updates.tags ?? currentBook.tags,
    seriesName: updates.seriesName ?? currentBook.seriesName ?? "",
    seriesNumber: updates.seriesNumber ?? currentBook.seriesNumber ?? "",
    cover: updates.cover
      ? normalizeBookCover({ ...currentBook.cover, ...updates.cover })
      : currentBook.cover,
    identifiers: updates.identifiers
      ? normalizeBookIdentifiers({ ...currentBook.identifiers, ...updates.identifiers })
      : currentBook.identifiers,
    status: updates.status ?? currentBook.status,
  };
};

/** @type { CreateApplication } */
const createApplication = ({ config: _config, dataStore, logger: _logger }) => {
  return {
    health: () => {
      // TODO: rewrite to actually check health of all dependencies
      // after implementing real adapters
      return {
        status: "ok",
      };
    },
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
