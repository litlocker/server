import { Config } from "./interfaces/config.d.ts";
import { BookRecord, DataStore } from "./interfaces/data-store.d.ts";
import { Logger } from "./interfaces/logger.d.ts";

type Hello = ({ name }: { name: string }) => string;
type CreateBook = ({ book }: { book: Record<string, unknown> }) => BookRecord;
type UpdateBook = ({
  id,
  updates,
}: {
  id: string;
  updates: Record<string, unknown>;
}) => BookRecord | null;
type ListBooks = () => BookRecord[];
type GetBook = ({ id }: { id: string }) => BookRecord | null;

interface Application {
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
