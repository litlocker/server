import { Book, CreateBookInput, UpdateBookInput } from "./entities/book.d.ts";
import { Clock } from "./interfaces/clock.d.ts";
import { Config } from "./interfaces/config.d.ts";
import { IdGenerator } from "./interfaces/id-generator.d.ts";
import { Logger } from "./interfaces/logger.d.ts";
import { Persistence } from "./interfaces/persistence.d.ts";
import { Result, HealthStatus } from "./interfaces/result.d.ts";

type Health = () => Result<HealthStatus>;
type CreateBook = ({ book }: { book: CreateBookInput }) => Book;
type UpdateBook = ({ id, updates }: { id: string; updates: UpdateBookInput }) => Book | null;
type ListBooks = () => Book[];
type GetBook = ({ id }: { id: string }) => Book | null;

interface Application {
  health: Health;
  createBook: CreateBook;
  updateBook: UpdateBook;
  listBooks: ListBooks;
  getBook: GetBook;
}

interface Deps {
  clock: Clock;
  config: Config;
  logger: Logger;
  persistence: Persistence;
  idGenerator: IdGenerator;
}

type CreateApplication = (deps: Deps) => Application;

export type { Application, CreateApplication };
