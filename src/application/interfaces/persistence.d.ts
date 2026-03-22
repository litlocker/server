import { Book } from "../entities/book.d.ts";
import { ImportJob } from "./import-job.d.ts";
import { ReadingProgress } from "./reading-progress.d.ts";
import { CheckHealth } from "./result.d.ts";
import { Shelf } from "./shelf.d.ts";
import { User } from "./user.d.ts";

interface BooksPersistence {
  create: ({ record }: { record: Book }) => Book;
  update: ({ id, updates }: { id: string; updates: Partial<Book> }) => Book | null;
  list: () => Book[];
  search: ({ query }: { query: string }) => Book[];
  get: ({ id }: { id: string }) => Book | null;
  checkHealth: CheckHealth;
}

interface ShelvesPersistence {
  create: ({ record }: { record: Shelf }) => Shelf;
  update: ({ id, updates }: { id: string; updates: Partial<Shelf> }) => Shelf | null;
  list: () => Shelf[];
  get: ({ id }: { id: string }) => Shelf | null;
  delete: ({ id }: { id: string }) => { success: boolean };
  checkHealth: CheckHealth;
}

interface UsersPersistence {
  create: ({ record }: { record: User }) => User;
  update: ({ id, updates }: { id: string; updates: Partial<User> }) => User | null;
  list: () => User[];
  get: ({ id }: { id: string }) => User | null;
  checkHealth: CheckHealth;
}

interface ImportJobsPersistence {
  create: ({ record }: { record: ImportJob }) => ImportJob;
  update: ({ id, updates }: { id: string; updates: Partial<ImportJob> }) => ImportJob | null;
  list: () => ImportJob[];
  get: ({ id }: { id: string }) => ImportJob | null;
  checkHealth: CheckHealth;
}

interface ReadingProgressPersistence {
  save: ({ record }: { record: ReadingProgress }) => ReadingProgress;
  get: ({ bookId, userId }: { bookId: string; userId: string }) => ReadingProgress | null;
  checkHealth: CheckHealth;
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
