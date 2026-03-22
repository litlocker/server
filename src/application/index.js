/**
 * @import { CreateApplication } from './interface.js'
 * @import { BookCover, BookIdentifiers, CreateBookInput, UpdateBookInput } from './entities/book.js'
 * @import { Book } from './entities/book.js'
 * @import { ListBooksInput } from './interfaces/book.js'
 * @import { CreateShelfInput, Shelf, UpdateShelfInput } from './interfaces/shelf.js'
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

/**
 * @param { CreateShelfInput } shelf
 */
const normalizeShelf = (shelf) => {
  return {
    kind: "manual",
    name: shelf.name,
    description: shelf.description ?? "",
    bookIds: [],
  };
};

/**
 * @param { object } params
 * @param { ReturnType<import('./interfaces/persistence.js').Persistence['shelves']['get']> extends infer T ? Exclude<T, null> : never } params.currentShelf
 * @param { UpdateShelfInput } params.updates
 */
const normalizeShelfUpdates = ({ currentShelf, updates }) => {
  return {
    kind: currentShelf.kind,
    name: updates.name ?? currentShelf.name,
    description: updates.description ?? currentShelf.description,
  };
};

/**
 * @param { Shelf } shelf
 * @param { string } bookId
 * @returns { string[] }
 */
const addBookIdToShelf = (shelf, bookId) => {
  if (shelf.bookIds.includes(bookId)) {
    return shelf.bookIds;
  }

  return [...shelf.bookIds, bookId];
};

/**
 * @param { Shelf } shelf
 * @param { string } bookId
 * @returns { string[] }
 */
const removeBookIdFromShelf = (shelf, bookId) => {
  return shelf.bookIds.filter((currentBookId) => currentBookId !== bookId);
};

/**
 * @param { string } value
 * @returns { string }
 */
const normalizeSearchValue = (value) => {
  return value.trim().toLocaleLowerCase();
};

/**
 * @param { Book } book
 * @param { ListBooksInput } filters
 * @param { Shelf | null } shelf
 * @returns { boolean }
 */
const doesBookMatchFilters = (book, filters, shelf) => {
  if (filters.title) {
    const normalizedTitle = normalizeSearchValue(filters.title);

    if (!book.title.toLocaleLowerCase().includes(normalizedTitle)) {
      return false;
    }
  }

  if (filters.author) {
    const normalizedAuthor = normalizeSearchValue(filters.author);
    const hasMatchingAuthor = book.authors.some((author) =>
      author.toLocaleLowerCase().includes(normalizedAuthor),
    );

    if (!hasMatchingAuthor) {
      return false;
    }
  }

  if (filters.tag) {
    const normalizedTag = normalizeSearchValue(filters.tag);
    const hasMatchingTag = book.tags.some((tag) => tag.toLocaleLowerCase() === normalizedTag);

    if (!hasMatchingTag) {
      return false;
    }
  }

  if (filters.shelfId) {
    if (!shelf) {
      return false;
    }

    return shelf.bookIds.includes(book.id);
  }

  return true;
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
    listBooks: ({ filters } = {}) => {
      const books = persistence.books.list();

      if (!filters) {
        return books;
      }

      const shelf = filters.shelfId ? persistence.shelves.get({ id: filters.shelfId }) : null;

      return books.filter((book) => doesBookMatchFilters(book, filters, shelf));
    },
    getBook: ({ id }) => {
      return persistence.books.get({ id });
    },
    createShelf: ({ shelf }) => {
      return persistence.shelves.create({
        record: {
          id: idGenerator.generate(),
          ...normalizeShelf(shelf),
        },
      });
    },
    updateShelf: ({ id, updates }) => {
      const currentShelf = persistence.shelves.get({ id });

      if (!currentShelf) {
        return null;
      }

      return persistence.shelves.update({
        id,
        updates: normalizeShelfUpdates({ currentShelf, updates }),
      });
    },
    listShelves: () => {
      return persistence.shelves.list();
    },
    deleteShelf: ({ id }) => {
      return persistence.shelves.delete({ id });
    },
    addBookToShelf: ({ shelfId, bookId }) => {
      const currentShelf = persistence.shelves.get({ id: shelfId });

      if (!currentShelf) {
        return null;
      }

      const currentBook = persistence.books.get({ id: bookId });

      if (!currentBook) {
        return null;
      }

      return persistence.shelves.update({
        id: shelfId,
        updates: {
          bookIds: addBookIdToShelf(currentShelf, currentBook.id),
        },
      });
    },
    removeBookFromShelf: ({ shelfId, bookId }) => {
      const currentShelf = persistence.shelves.get({ id: shelfId });

      if (!currentShelf) {
        return null;
      }

      return persistence.shelves.update({
        id: shelfId,
        updates: {
          bookIds: removeBookIdFromShelf(currentShelf, bookId),
        },
      });
    },
  };
};

export { createApplication };
