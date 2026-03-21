import { Book, CreateBookInput, UpdateBookInput } from "./entities/book.d.ts";
import { Config } from "./interfaces/config.d.ts";
import { DataStore } from "./interfaces/data-store.d.ts";
import { Logger } from "./interfaces/logger.d.ts";

interface HealthStatus {
  status: "ok";
}

type Health = () => HealthStatus;
type Hello = ({ name }: { name: string }) => string;
type CreateBook = ({ book }: { book: CreateBookInput }) => Book;
type UpdateBook = ({ id, updates }: { id: string; updates: UpdateBookInput }) => Book | null;
type ListBooks = () => Book[];
type GetBook = ({ id }: { id: string }) => Book | null;

interface Application {
  health: Health;
  hello: Hello;
  createBook: CreateBook;
  updateBook: UpdateBook;
  listBooks: ListBooks;
  getBook: GetBook;
}

interface Deps {
  config: Config;
  logger: Logger;
  dataStore: DataStore;
}

type CreateApplication = (deps: Deps) => Application;

export type { Application, CreateApplication };
