import { Book } from "../entities/book.d.ts";
import { ImportJob } from "../entities/import-job.d.ts";
import { ReadingProgress } from "../entities/reading-progress.d.ts";
import { User } from "../entities/user.d.ts";
import { Awaitable, CheckHealth } from "./result.d.ts";
import { Shelf } from "./shelf.d.ts";

interface BooksPersistence {
  create: ({ record }: { record: Book }) => Awaitable<Book>;
  update: ({ id, updates }: { id: string; updates: Partial<Book> }) => Awaitable<Book | null>;
  list: () => Awaitable<Book[]>;
  search: ({ query }: { query: string }) => Awaitable<Book[]>;
  get: ({ id }: { id: string }) => Awaitable<Book | null>;
}

interface ShelvesPersistence {
  create: ({ record }: { record: Shelf }) => Awaitable<Shelf>;
  update: ({ id, updates }: { id: string; updates: Partial<Shelf> }) => Awaitable<Shelf | null>;
  list: () => Awaitable<Shelf[]>;
  get: ({ id }: { id: string }) => Awaitable<Shelf | null>;
  delete: ({ id }: { id: string }) => Awaitable<{ success: boolean }>;
}

interface UsersPersistence {
  create: ({ record }: { record: User }) => Awaitable<User>;
  update: ({ id, updates }: { id: string; updates: Partial<User> }) => Awaitable<User | null>;
  list: () => Awaitable<User[]>;
  get: ({ id }: { id: string }) => Awaitable<User | null>;
  getByAuthIdentity: ({
    authIssuer,
    authSubject,
  }: {
    authIssuer: string;
    authSubject: string;
  }) => Awaitable<User | null>;
}

interface ImportJobsPersistence {
  create: ({ record }: { record: ImportJob }) => Awaitable<ImportJob>;
  update: ({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<ImportJob>;
  }) => Awaitable<ImportJob | null>;
  list: () => Awaitable<ImportJob[]>;
  get: ({ id }: { id: string }) => Awaitable<ImportJob | null>;
}

interface ReadingProgressPersistence {
  save: ({ record }: { record: ReadingProgress }) => Awaitable<ReadingProgress>;
  get: ({
    bookId,
    userId,
  }: {
    bookId: string;
    userId: string;
  }) => Awaitable<ReadingProgress | null>;
}

interface Persistence {
  books: BooksPersistence;
  shelves: ShelvesPersistence;
  users: UsersPersistence;
  importJobs: ImportJobsPersistence;
  readingProgress: ReadingProgressPersistence;
  checkHealth: CheckHealth;
}

type CreatePersistence = () => Persistence;

export type { Persistence, CreatePersistence };
