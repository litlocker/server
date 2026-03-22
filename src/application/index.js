/**
 * @import { CreateApplication } from './interface.js'
 * @import { BookCover, BookIdentifiers, CreateBookInput, UpdateBookInput } from './entities/book.js'
 * @import { Book } from './entities/book.js'
 * @import { ImportJob, ImportJobDuplicateDetection, ImportJobErrorDetails, ImportJobMetadataCandidate, ImportJobSource, CreateImportJobInput } from './interfaces/import-job.js'
 * @import { ListBooksInput } from './interfaces/book.js'
 * @import { ReadingProgress, SaveReadingProgressInput } from './interfaces/reading-progress.js'
 * @import { CreateShelfInput, Shelf, UpdateShelfInput } from './interfaces/shelf.js'
 * @import { FailureResult, HealthStatus, SuccessResult } from './interfaces/result.js'
 */

import { createHash } from "node:crypto";
import { join } from "node:path";

/**
 * @param {Record<string, unknown>} details
 * @returns {SuccessResult<HealthStatus>}
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

/**
 * @param {Record<string, unknown>} details
 * @returns {FailureResult}
 */
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
 * @returns {import('./interfaces/file-storage.js').FileStorage}
 */
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
 * @returns {import('./interfaces/metadata-provider.js').MetadataProvider}
 */
const createDefaultMetadataProvider = () => {
  return {
    extractMetadata: () => null,
    lookupMetadata: () => [],
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
 * @param {Exclude<ReturnType<import('./interfaces/metadata-provider.js').MetadataProvider['extractMetadata']>, null>} metadataRecord
 * @returns {ImportJobMetadataCandidate}
 */
const createImportJobMetadataCandidateFromRecord = (metadataRecord) => {
  return normalizeImportJobMetadataCandidate({
    ...metadataRecord,
    confidence: "1.00",
  });
};

/**
 * @param {ReturnType<import('./interfaces/metadata-provider.js').MetadataProvider['lookupMetadata']>[number]} metadataRecord
 * @returns {ImportJobMetadataCandidate}
 */
const createImportJobMetadataCandidateFromLookupRecord = (metadataRecord) => {
  return normalizeImportJobMetadataCandidate({
    ...metadataRecord,
    confidence: "0.80",
  });
};

/**
 * @param { ImportJobMetadataCandidate[] | undefined } metadataCandidates
 * @returns { ImportJobMetadataCandidate[] }
 */
const normalizeImportJobMetadataCandidates = (metadataCandidates) => {
  return metadataCandidates ? metadataCandidates.map(normalizeImportJobMetadataCandidate) : [];
};

/**
 * @param { Partial<ImportJobErrorDetails> } [error]
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
 * @param { Partial<ImportJobDuplicateDetection> } [duplicateDetection]
 * @returns { ImportJobDuplicateDetection }
 */
const normalizeImportJobDuplicateDetection = (duplicateDetection) => {
  return {
    fileHash: duplicateDetection?.fileHash ?? "",
    duplicateImportJobIds: duplicateDetection?.duplicateImportJobIds
      ? [...duplicateDetection.duplicateImportJobIds]
      : [],
    duplicateBookIds: duplicateDetection?.duplicateBookIds
      ? [...duplicateDetection.duplicateBookIds]
      : [],
  };
};

/**
 * @param { CreateImportJobInput } job
 * @returns { Omit<ImportJob, "id"> }
 */
const normalizeImportJob = (job) => {
  return {
    status: "queued",
    source: normalizeImportJobSource(job.source),
    detectedFileType: job.detectedFileType ?? "",
    metadataCandidates: normalizeImportJobMetadataCandidates(job.metadataCandidates),
    selectedMetadataCandidateIndex: -1,
    duplicateDetection: normalizeImportJobDuplicateDetection(),
    error: normalizeImportJobError(),
  };
};

/**
 * @param {BookIdentifiers} identifiers
 * @returns {[string, string][]}
 */
const getNonEmptyIdentifierEntries = (identifiers) => {
  return Object.entries(identifiers).filter(([, value]) => value !== "");
};

/**
 * @param {Uint8Array} contents
 * @returns {string}
 */
const createFileHash = (contents) => {
  return createHash("sha256").update(Buffer.from(contents)).digest("hex");
};

/**
 * @param {object} params
 * @param {string} params.fileHash
 * @param {ImportJob[]} params.importJobs
 * @returns {string[]}
 */
const findDuplicateImportJobIds = ({ fileHash, importJobs }) => {
  if (!fileHash) {
    return [];
  }

  return importJobs
    .filter((importJob) => importJob.duplicateDetection.fileHash === fileHash)
    .map((importJob) => importJob.id);
};

/**
 * @param {object} params
 * @param {Book[]} params.books
 * @param {ImportJobMetadataCandidate[]} params.metadataCandidates
 * @returns {string[]}
 */
const findDuplicateBookIds = ({ books, metadataCandidates }) => {
  if (metadataCandidates.length === 0) {
    return [];
  }

  const duplicateBookIds = new Set();

  books.forEach((book) => {
    const bookIdentifierEntries = getNonEmptyIdentifierEntries(book.identifiers);

    if (bookIdentifierEntries.length === 0) {
      return;
    }

    const isDuplicate = metadataCandidates.some((metadataCandidate) => {
      const candidateIdentifierEntries = getNonEmptyIdentifierEntries(
        metadataCandidate.identifiers,
      );

      return candidateIdentifierEntries.some(([key, value]) =>
        bookIdentifierEntries.some(
          ([bookKey, bookValue]) => bookKey === key && bookValue === value,
        ),
      );
    });

    if (isDuplicate) {
      duplicateBookIds.add(book.id);
    }
  });

  return Array.from(duplicateBookIds);
};

/**
 * @param {object} params
 * @param {boolean} params.duplicateCheckEnabled
 * @param {string} params.fileHash
 * @param {ImportJobMetadataCandidate[]} params.metadataCandidates
 * @param {import('./interfaces/persistence.js').Persistence} params.persistence
 * @returns {ImportJobDuplicateDetection}
 */
const createDuplicateDetection = ({
  duplicateCheckEnabled,
  fileHash,
  metadataCandidates,
  persistence,
}) => {
  if (!duplicateCheckEnabled) {
    return normalizeImportJobDuplicateDetection();
  }

  return normalizeImportJobDuplicateDetection({
    fileHash,
    duplicateImportJobIds: findDuplicateImportJobIds({
      fileHash,
      importJobs: persistence.importJobs.list(),
    }),
    duplicateBookIds: findDuplicateBookIds({
      books: persistence.books.list(),
      metadataCandidates,
    }),
  });
};

/**
 * @param {object} params
 * @param {import('./interfaces/metadata-provider.js').MetadataProvider} params.metadataProvider
 * @param {string} params.filePath
 * @param {string} params.fileType
 * @returns {ImportJobMetadataCandidate[]}
 */
const createEmbeddedMetadataCandidates = ({ metadataProvider, filePath, fileType }) => {
  if (!filePath || !fileType) {
    return [];
  }

  const metadataRecord = metadataProvider.extractMetadata({
    input: {
      filePath,
      fileType,
    },
  });

  if (!metadataRecord) {
    return [];
  }

  return [createImportJobMetadataCandidateFromRecord(metadataRecord)];
};

/**
 * @param {object} params
 * @param {import('./interfaces/metadata-provider.js').MetadataProvider} params.metadataProvider
 * @param {ImportJobMetadataCandidate[]} params.metadataCandidates
 * @returns {ImportJobMetadataCandidate[]}
 */
const createExternalMetadataCandidates = ({ metadataProvider, metadataCandidates }) => {
  const [primaryMetadataCandidate] = metadataCandidates;

  if (!primaryMetadataCandidate) {
    return [];
  }

  return metadataProvider
    .lookupMetadata({
      input: {
        title: primaryMetadataCandidate.title,
        authors: primaryMetadataCandidate.authors,
        identifiers: primaryMetadataCandidate.identifiers,
      },
    })
    .map(createImportJobMetadataCandidateFromLookupRecord);
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
 * @param { object } params
 * @param { string } params.coversPath
 * @param { string } params.importJobId
 * @param { string } params.sourceCoverPath
 * @returns { string }
 */
const createStoredCoverPath = ({ coversPath, importJobId, sourceCoverPath }) => {
  const extensionIndex = sourceCoverPath.lastIndexOf(".");
  const fileExtension =
    extensionIndex >= 0 ? sourceCoverPath.slice(extensionIndex).toLocaleLowerCase() : "";

  return join(coversPath, `${importJobId}${fileExtension}`);
};

/**
 * @param {string} filePath
 * @returns {string}
 */
const createMimeTypeFromFilePath = (filePath) => {
  const normalizedPath = filePath.toLocaleLowerCase();

  if (normalizedPath.endsWith(".jpg") || normalizedPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedPath.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedPath.endsWith(".webp")) {
    return "image/webp";
  }

  return "";
};

/**
 * @param {object} params
 * @param {ImportJobMetadataCandidate[]} params.metadataCandidates
 * @param {number} params.metadataCandidateIndex
 * @param {Partial<ImportJobMetadataCandidate>} params.updates
 * @returns {ImportJobMetadataCandidate[]}
 */
const updateMetadataCandidateAtIndex = ({
  metadataCandidates,
  metadataCandidateIndex,
  updates,
}) => {
  return metadataCandidates.map((metadataCandidate, index) => {
    if (index !== metadataCandidateIndex) {
      return metadataCandidate;
    }

    return normalizeImportJobMetadataCandidate({
      ...metadataCandidate,
      ...updates,
    });
  });
};

/**
 * @param {object} params
 * @param {import('./interfaces/config.js').Config} params.config
 * @param {import('./interfaces/file-storage.js').FileStorage} params.fileStorage
 * @param {ImportJob} params.importJob
 * @returns {ImportJob}
 */
const storeSelectedMetadataCandidateCover = ({ config, fileStorage, importJob }) => {
  if (importJob.selectedMetadataCandidateIndex < 0) {
    return importJob;
  }

  const selectedMetadataCandidate =
    importJob.metadataCandidates[importJob.selectedMetadataCandidateIndex] ?? null;

  if (!selectedMetadataCandidate?.coverPath) {
    return importJob;
  }

  if (!fileStorage.fileExists({ file: { path: selectedMetadataCandidate.coverPath } })) {
    return importJob;
  }

  const storedCoverPath = createStoredCoverPath({
    coversPath: config.storage.paths.covers,
    importJobId: importJob.id,
    sourceCoverPath: selectedMetadataCandidate.coverPath,
  });
  const coverContents = fileStorage.readFile({
    file: {
      path: selectedMetadataCandidate.coverPath,
    },
  });

  fileStorage.saveFile({
    file: {
      path: storedCoverPath,
      name: storedCoverPath.split("/").pop() ?? "",
      mimeType: createMimeTypeFromFilePath(storedCoverPath),
      contents: coverContents,
    },
  });

  return {
    ...importJob,
    metadataCandidates: updateMetadataCandidateAtIndex({
      metadataCandidates: importJob.metadataCandidates,
      metadataCandidateIndex: importJob.selectedMetadataCandidateIndex,
      updates: {
        coverPath: storedCoverPath,
      },
    }),
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
    filePath: book.filePath ?? "",
    libraryStatus: book.libraryStatus ?? "draft",
    readingStatus: book.readingStatus ?? "unread",
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
    filePath: updates.filePath ?? currentBook.filePath ?? "",
    libraryStatus: updates.libraryStatus ?? currentBook.libraryStatus,
    readingStatus: updates.readingStatus ?? currentBook.readingStatus,
  };
};

/**
 * @param { CreateShelfInput } shelf
 * @returns { Omit<Shelf, "id"> }
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
 * @param {string} filePath
 * @returns {string}
 */
const createFileNameFromPath = (filePath) => {
  return filePath.split("/").pop() ?? "";
};

/**
 * @param {string} filePath
 * @returns {string}
 */
const createBookFileFormatFromPath = (filePath) => {
  const extensionIndex = filePath.lastIndexOf(".");

  if (extensionIndex < 0 || extensionIndex === filePath.length - 1) {
    return "";
  }

  return filePath.slice(extensionIndex + 1).toLocaleLowerCase();
};

/**
 * @param {string} filePath
 * @returns {string}
 */
const createBookFileMimeTypeFromPath = (filePath) => {
  const format = createBookFileFormatFromPath(filePath);

  switch (format) {
    case "epub":
      return "application/epub+zip";
    case "pdf":
      return "application/pdf";
    case "cbz":
      return "application/vnd.comicbook+zip";
    case "cbr":
      return "application/vnd.comicbook-rar";
    default:
      return "";
  }
};

/**
 * @param {SaveReadingProgressInput} progress
 * @param {string} timestamp
 * @returns {Omit<ReadingProgress, "id">}
 */
const normalizeReadingProgress = (progress, timestamp) => {
  return {
    bookId: progress.bookId,
    userId: progress.userId,
    format: progress.format,
    locator: progress.locator ?? "",
    percentage: progress.percentage ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

/**
 * @param {string} percentage
 * @returns {number}
 */
const parseProgressPercentage = (percentage) => {
  const parsedPercentage = Number.parseFloat(percentage);

  if (Number.isNaN(parsedPercentage)) {
    return 0;
  }

  return parsedPercentage;
};

/**
 * @param {Book} book
 * @param {string} percentage
 * @returns {import('./entities/book.js').BookReadingStatus}
 */
const createBookReadingStatusFromProgress = (book, percentage) => {
  const normalizedPercentage = parseProgressPercentage(percentage);

  if (normalizedPercentage >= 1) {
    return "finished";
  }

  if (normalizedPercentage > 0) {
    return "started";
  }

  return book.readingStatus;
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
  metadataProvider = createDefaultMetadataProvider(),
  persistence,
  idGenerator,
  logger,
}) => {
  return {
    health: () => {
      const checks = {
        clock: clock.checkHealth(),
        fileStorage: fileStorage.checkHealth(),
        metadataProvider: metadataProvider.checkHealth(),
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
    getBookFileAccess: ({ id }) => {
      const book = persistence.books.get({ id });

      if (!book?.filePath) {
        return null;
      }

      if (!fileStorage.fileExists({ file: { path: book.filePath } })) {
        return null;
      }

      return {
        bookId: book.id,
        fileName: createFileNameFromPath(book.filePath),
        format: createBookFileFormatFromPath(book.filePath),
        mimeType: createBookFileMimeTypeFromPath(book.filePath),
        contents: fileStorage.readFile({
          file: {
            path: book.filePath,
          },
        }),
      };
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
      const embeddedMetadataCandidates =
        job.metadataCandidates && job.metadataCandidates.length > 0
          ? normalizeImportJobMetadataCandidates(job.metadataCandidates)
          : createEmbeddedMetadataCandidates({
              metadataProvider,
              filePath: job.source.path,
              fileType: job.detectedFileType ?? "",
            });
      const metadataCandidates = [
        ...embeddedMetadataCandidates,
        ...createExternalMetadataCandidates({
          metadataProvider,
          metadataCandidates: embeddedMetadataCandidates,
        }),
      ];

      return persistence.importJobs.create({
        record: {
          id: idGenerator.generate(),
          ...normalizeImportJob({
            ...job,
            metadataCandidates,
          }),
          duplicateDetection: createDuplicateDetection({
            duplicateCheckEnabled: config.imports.duplicateCheckEnabled,
            fileHash: job.fileHash ?? "",
            metadataCandidates,
            persistence,
          }),
        },
      });
    },
    ingestImportUpload: ({ upload }) => {
      const importJobId = idGenerator.generate();
      const fileHash = createFileHash(upload.contents);
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
      const detectedFileType = detectFileTypeFromFileName(upload.name);
      const embeddedMetadataCandidates = createEmbeddedMetadataCandidates({
        metadataProvider,
        filePath: savedFile.path,
        fileType: detectedFileType,
      });
      const metadataCandidates = [
        ...embeddedMetadataCandidates,
        ...createExternalMetadataCandidates({
          metadataProvider,
          metadataCandidates: embeddedMetadataCandidates,
        }),
      ];

      return persistence.importJobs.create({
        record: {
          id: importJobId,
          ...normalizeImportJob({
            source: {
              kind: "upload",
              path: savedFile.path,
              originalFileName: upload.name,
            },
            detectedFileType,
            metadataCandidates,
          }),
          duplicateDetection: createDuplicateDetection({
            duplicateCheckEnabled: config.imports.duplicateCheckEnabled,
            fileHash,
            metadataCandidates,
            persistence,
          }),
        },
      });
    },
    reviewImportJob: ({ id, metadataCandidateIndex }) => {
      const currentImportJob = persistence.importJobs.get({ id });

      if (!currentImportJob) {
        return null;
      }

      if (
        metadataCandidateIndex < 0 ||
        metadataCandidateIndex >= currentImportJob.metadataCandidates.length
      ) {
        return null;
      }

      return persistence.importJobs.update({
        id,
        updates: {
          status: "review",
          selectedMetadataCandidateIndex: metadataCandidateIndex,
        },
      });
    },
    listImportJobs: () => {
      return persistence.importJobs.list();
    },
    getImportJob: ({ id }) => {
      return persistence.importJobs.get({ id });
    },
    saveReadingProgress: ({ progress }) => {
      const currentBook = persistence.books.get({ id: progress.bookId });

      if (!currentBook) {
        return null;
      }

      const currentUser = persistence.users.get({ id: progress.userId });

      if (!currentUser) {
        return null;
      }

      const currentReadingProgress = persistence.readingProgress.get({
        bookId: progress.bookId,
        userId: progress.userId,
      });
      const timestamp = clock.now().toISOString();
      const nextPercentage = progress.percentage ?? currentReadingProgress?.percentage ?? "";
      const savedReadingProgress = persistence.readingProgress.save({
        record: currentReadingProgress
          ? {
              ...currentReadingProgress,
              format: progress.format,
              locator: progress.locator ?? currentReadingProgress.locator,
              percentage: nextPercentage,
              updatedAt: timestamp,
            }
          : {
              id: idGenerator.generate(),
              ...normalizeReadingProgress(
                {
                  ...progress,
                  percentage: nextPercentage,
                },
                timestamp,
              ),
            },
      });

      persistence.books.update({
        id: currentBook.id,
        updates: {
          readingStatus:
            currentBook.libraryStatus === "archived"
              ? currentBook.readingStatus
              : createBookReadingStatusFromProgress(currentBook, savedReadingProgress.percentage),
        },
      });

      return savedReadingProgress;
    },
    getReadingProgress: ({ bookId, userId }) => {
      return persistence.readingProgress.get({ bookId, userId });
    },
    finalizeImportJob: ({ id }) => {
      const currentImportJob = persistence.importJobs.get({ id });

      if (!currentImportJob) {
        return null;
      }

      if (
        currentImportJob.metadataCandidates.length > 0 &&
        currentImportJob.selectedMetadataCandidateIndex < 0
      ) {
        return null;
      }

      const importJobWithStoredCover = storeSelectedMetadataCandidateCover({
        config,
        fileStorage,
        importJob: currentImportJob,
      });

      return persistence.importJobs.update({
        id,
        updates: {
          metadataCandidates: importJobWithStoredCover.metadataCandidates,
          status: "completed",
          error: normalizeImportJobError(),
        },
      });
    },
  };
};

export { createApplication };
