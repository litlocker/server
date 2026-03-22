/**
 * @import { CreatePersistence } from "../../../application/interfaces/persistence.js";
 */

const createHealthResult = () => {
  return {
    success: true,
    data: {
      status: "ok",
      details: {},
    },
  };
};

const normalizeSearchValue = (value) => {
  return value.trim().toLocaleLowerCase();
};

const createRecordStore = ({ searchRecord } = {}) => {
  const records = new Map();
  const store = {
    create: ({ record }) => {
      records.set(record.id, record);

      return record;
    },
    update: ({ id, updates }) => {
      const currentRecord = records.get(id);

      if (!currentRecord) {
        return null;
      }

      const nextRecord = {
        ...currentRecord,
        ...updates,
        id,
      };

      records.set(id, nextRecord);

      return nextRecord;
    },
    list: () => {
      return Array.from(records.values());
    },
    get: ({ id }) => {
      return records.get(id) ?? null;
    },
    delete: ({ id }) => {
      return {
        success: records.delete(id),
      };
    },
    checkHealth: createHealthResult,
  };

  if (searchRecord) {
    store.search = ({ query }) => {
      const normalizedQuery = normalizeSearchValue(query);

      if (!normalizedQuery) {
        return store.list();
      }

      return store.list().filter((record) => searchRecord(record, normalizedQuery));
    };
  }

  return store;
};

const doesBookMatchSearchQuery = (book, normalizedQuery) => {
  const searchableValues = [
    book.title,
    book.subtitle,
    book.description,
    book.language,
    ...book.authors,
    ...book.tags,
    book.seriesName,
    book.seriesNumber,
    ...Object.values(book.identifiers),
  ];

  return searchableValues.some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
};

const createReadingProgressStore = () => {
  const records = new Map();

  return {
    save: ({ record }) => {
      records.set(`${record.bookId}:${record.userId}`, record);

      return record;
    },
    get: ({ bookId, userId }) => {
      return records.get(`${bookId}:${userId}`) ?? null;
    },
    checkHealth: createHealthResult,
  };
};

/** @type { CreatePersistence } */
const createPersistenceInMemory = () => {
  const books = createRecordStore({
    searchRecord: doesBookMatchSearchQuery,
  });
  const shelves = createRecordStore();
  const users = createRecordStore();
  const importJobs = createRecordStore();
  const readingProgress = createReadingProgressStore();

  return {
    books,
    shelves,
    users,
    importJobs,
    readingProgress,
    checkHealth: createHealthResult,
  };
};

export { createPersistenceInMemory };
