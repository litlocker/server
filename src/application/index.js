/**
 * @import { CreateApplication } from './interface.js'
 * @import { BookCover, BookIdentifiers, CreateBookInput, UpdateBookInput } from './entities/book.js'
 * @import { Book } from './entities/book.js'
 * @import { ImportJobErrorDetails, ImportJobMetadataCandidate, ImportJobSource, CreateImportJobInput } from './interfaces/import-job.js'
 * @import { ListBooksInput } from './interfaces/book.js'
 * @import { CreateShelfInput, Shelf, UpdateShelfInput } from './interfaces/shelf.js'
 */

import { join } from "node:path";

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

const createDefaultFileStorage = () => {
  return {
    saveFile: () => {
      throw new Error("File storage is not configured");
    },
    readFile: () => new Uint8Array(),
    deleteFile: () => ({ success: false }),
    moveFile: () => {
      throw new Error("File storage is not configured");
    },
    fileExists: () => false,
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
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
 * @param { Partial<ImportJobSource> | undefined } source
 * @returns { ImportJobSource }
 */
const normalizeImportJobSource = (source) => {
  return {
    kind: source?.kind ?? "upload",
    path: source?.path ?? "",
    originalFileName: source?.originalFileName ?? "",
  };
};

/**
 * @param { Partial<BookIdentifiers> | undefined } identifiers
 */
const normalizeImportJobIdentifiers = (identifiers) => {
  return normalizeBookIdentifiers(identifiers);
};

/**
 * @param { Partial<ImportJobMetadataCandidate> | undefined } metadataCandidate
 * @returns { ImportJobMetadataCandidate }
 */
const normalizeImportJobMetadataCandidate = (metadataCandidate) => {
  return {
    title: metadataCandidate?.title ?? "",
    subtitle: metadataCandidate?.subtitle ?? "",
    description: metadataCandidate?.description ?? "",
    language: metadataCandidate?.language ?? "",
    authors: normalizeBookAuthors(metadataCandidate?.authors),
    tags: normalizeBookTags(metadataCandidate?.tags),
    seriesName: metadataCandidate?.seriesName ?? "",
    seriesNumber: metadataCandidate?.seriesNumber ?? "",
    identifiers: normalizeImportJobIdentifiers(metadataCandidate?.identifiers),
    coverPath: metadataCandidate?.coverPath ?? "",
    source: metadataCandidate?.source ?? "",
    confidence: metadataCandidate?.confidence ?? "",
  };
};

/**
 * @param { ImportJobMetadataCandidate[] | undefined } metadataCandidates
 * @returns { ImportJobMetadataCandidate[] }
 */
const normalizeImportJobMetadataCandidates = (metadataCandidates) => {
  return metadataCandidates ? metadataCandidates.map(normalizeImportJobMetadataCandidate) : [];
};

/**
 * @param { Partial<ImportJobErrorDetails> | undefined } error
 * @returns { ImportJobErrorDetails }
 */
const normalizeImportJobError = (error) => {
  return {
    code: error?.code ?? "",
    message: error?.message ?? "",
    details: error?.details ?? "",
  };
};

/**
 * @param { CreateImportJobInput } job
 */
const normalizeImportJob = (job) => {
  return {
    status: "queued",
    source: normalizeImportJobSource(job.source),
    detectedFileType: job.detectedFileType ?? "",
    metadataCandidates: normalizeImportJobMetadataCandidates(),
    error: normalizeImportJobError(),
  };
};

/**
 * @param { string } fileName
 * @returns { string }
 */
const detectFileTypeFromFileName = (fileName) => {
  const extensionIndex = fileName.lastIndexOf(".");

  if (extensionIndex < 0 || extensionIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(extensionIndex + 1).toLocaleLowerCase();
};

/**
 * @param { object } params
 * @param { string } params.importsPath
 * @param { string } params.importJobId
 * @param { string } params.originalFileName
 * @returns { string }
 */
const createImportUploadPath = ({ importsPath, importJobId, originalFileName }) => {
  const extensionIndex = originalFileName.lastIndexOf(".");
  const fileExtension =
    extensionIndex >= 0 ? originalFileName.slice(extensionIndex).toLocaleLowerCase() : "";

  return join(importsPath, `${importJobId}${fileExtension}`);
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
  if (filters.search) {
    const normalizedSearch = normalizeSearchValue(filters.search);
    const matchesSearch = [
      book.title,
      book.subtitle,
      book.description,
      book.language,
      ...book.authors,
      ...book.tags,
      book.seriesName,
      book.seriesNumber,
      ...Object.values(book.identifiers),
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));

    if (!matchesSearch) {
      return false;
    }
  }

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
const createApplication = ({
  clock,
  config,
  fileStorage = createDefaultFileStorage(),
  persistence,
  idGenerator,
  logger,
}) => {
  return {
    health: () => {
      const checks = {
        clock: clock.checkHealth(),
        fileStorage: fileStorage.checkHealth(),
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
      const books = filters?.search
        ? persistence.books.search({ query: filters.search })
        : persistence.books.list();

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
    createImportJob: ({ job }) => {
      return persistence.importJobs.create({
        record: {
          id: idGenerator.generate(),
          ...normalizeImportJob(job),
        },
      });
    },
    ingestImportUpload: ({ upload }) => {
      const importJobId = idGenerator.generate();
      const importPath = createImportUploadPath({
        importsPath: config.storage.paths.imports,
        importJobId,
        originalFileName: upload.name,
      });
      const savedFile = fileStorage.saveFile({
        file: {
          path: importPath,
          name: upload.name,
          mimeType: upload.mimeType ?? "",
          contents: upload.contents,
        },
      });

      return persistence.importJobs.create({
        record: {
          id: importJobId,
          ...normalizeImportJob({
            source: {
              kind: "upload",
              path: savedFile.path,
              originalFileName: upload.name,
            },
            detectedFileType: detectFileTypeFromFileName(upload.name),
          }),
        },
      });
    },
    listImportJobs: () => {
      return persistence.importJobs.list();
    },
    getImportJob: ({ id }) => {
      return persistence.importJobs.get({ id });
    },
    finalizeImportJob: ({ id }) => {
      const currentImportJob = persistence.importJobs.get({ id });

      if (!currentImportJob) {
        return null;
      }

      return persistence.importJobs.update({
        id,
        updates: {
          status: "completed",
          error: normalizeImportJobError(),
        },
      });
    },
  };
};

export { createApplication };
