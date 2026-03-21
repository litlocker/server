/**
 * @import { CreateApplication } from './interface.js'
 * @import { BookCover, BookIdentifiers, CreateBookInput, UpdateBookInput } from './entities/book.js'
 */

const createHealthSuccessResult = (details) => {
  return {
    success: true,
    data: {
      status: "ok",
      details,
    },
  };
};

const createHealthFailureResult = (details) => {
  return {
    success: false,
    error: {
      code: "dependency_unavailable",
      message: "One or more application dependencies are unavailable",
      details,
    },
  };
};

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
 * @param { ReturnType<import('./interfaces/persistence.js').Persistence['books']['get']> extends infer T ? Exclude<T, null> : never } params.currentBook
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
const createApplication = ({ clock, config: _config, persistence, idGenerator, logger }) => {
  return {
    health: () => {
      const checks = {
        clock: clock.checkHealth(),
        persistence: persistence.checkHealth(),
        idGenerator: idGenerator.checkHealth(),
        logger: logger.checkHealth(),
      };
      const hasFailures = Object.values(checks).some((result) => !result.success);

      if (hasFailures) {
        return createHealthFailureResult({
          checks,
        });
      }

      return createHealthSuccessResult({
        checks,
      });
    },
    createBook: ({ book }) => {
      return persistence.books.create({
        record: {
          id: idGenerator.generate(),
          ...normalizeBook(book),
        },
      });
    },
    updateBook: ({ id, updates }) => {
      const currentBook = persistence.books.get({ id });

      if (!currentBook) {
        return null;
      }

      return persistence.books.update({
        id,
        updates: normalizeBookUpdates({ currentBook, updates }),
      });
    },
    listBooks: () => {
      return persistence.books.list();
    },
    getBook: ({ id }) => {
      return persistence.books.get({ id });
    },
  };
};

export { createApplication };
