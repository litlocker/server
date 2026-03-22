/**
 * @import { CreatePersistence, Persistence } from "../../../application/interfaces/persistence.js";
 * @import { Book } from "../../../application/entities/book.js";
 * @import { ReadingProgress } from "../../../application/entities/reading-progress.js";
 * @import { User } from "../../../application/entities/user.js";
 * @import { HealthStatus, SuccessResult } from "../../../application/interfaces/result.js";
 */

/**
 * @returns {SuccessResult<HealthStatus>}
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

/**
 * @param {string} value
 * @returns {string}
 */
const normalizeSearchValue = (value) => {
  return value.trim().toLocaleLowerCase();
};

/**
 * @template {{ id: string }} TRecord
 * @param {object} [params]
 * @param {(record: TRecord, normalizedQuery: string) => boolean} [params.searchRecord]
 */
const createRecordStore = ({ searchRecord } = {}) => {
  /** @type {Map<string, TRecord>} */
  const records = new Map();
  /**
   * @type {{
   *   create: ({ record }: { record: TRecord }) => TRecord;
   *   update: ({ id, updates }: { id: string; updates: Partial<TRecord> }) => TRecord | null;
   *   list: () => TRecord[];
   *   get: ({ id }: { id: string }) => TRecord | null;
   *   delete: ({ id }: { id: string }) => { success: boolean };
   *   search?: ({ query }: { query: string }) => TRecord[];
   * }}
   */
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

/**
 * @param {Book} book
 * @param {string} normalizedQuery
 * @returns {boolean}
 */
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

/**
 * @returns {Persistence["readingProgress"]}
 */
const createReadingProgressStore = () => {
  /** @type {Map<string, ReadingProgress>} */
  const records = new Map();

  return {
    /** @param {{ record: ReadingProgress }} params */
    save: ({ record }) => {
      records.set(`${record.bookId}:${record.userId}`, record);

      return record;
    },
    /** @param {{ bookId: string; userId: string }} params */
    get: ({ bookId, userId }) => {
      return records.get(`${bookId}:${userId}`) ?? null;
    },
  };
};

/** @type { CreatePersistence } */
const createPersistenceInMemory = () => {
  const books =
    /** @type {Persistence["books"]} */ (
      createRecordStore({
        searchRecord: doesBookMatchSearchQuery,
      })
    );
  /** @type {Persistence["shelves"]} */
  const shelves = createRecordStore();
  const usersRecordStore =
    /** @type {{
     *   create: ({ record }: { record: User }) => User;
     *   update: ({ id, updates }: { id: string; updates: Partial<User> }) => User | null;
     *   list: () => User[];
     *   get: ({ id }: { id: string }) => User | null;
     * }} */ (createRecordStore());
  /** @type {Persistence["users"]} */
  const users = {
    ...usersRecordStore,
    getByAuthIdentity: async ({ authIssuer, authSubject }) => {
      return (
        usersRecordStore
          .list()
          .find((user) => user.authIssuer === authIssuer && user.authSubject === authSubject) ??
        null
      );
    },
  };
  /** @type {Persistence["importJobs"]} */
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
