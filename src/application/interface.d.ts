import { Book, CreateBookInput, UpdateBookInput } from "./entities/book.d.ts";
import { Clock } from "./interfaces/clock.d.ts";
import { Config } from "./interfaces/config.d.ts";
import { IdGenerator } from "./interfaces/id-generator.d.ts";
import { Logger } from "./interfaces/logger.d.ts";
import { Persistence } from "./interfaces/persistence.d.ts";
import { Result, HealthStatus } from "./interfaces/result.d.ts";
import {
  AddBookToShelfInput,
  CreateShelfInput,
  RemoveBookFromShelfInput,
  Shelf,
  UpdateShelfInput,
} from "./interfaces/shelf.d.ts";

type Health = () => Result<HealthStatus>;
type CreateBook = ({ book }: { book: CreateBookInput }) => Book;
type UpdateBook = ({ id, updates }: { id: string; updates: UpdateBookInput }) => Book | null;
type ListBooks = () => Book[];
type GetBook = ({ id }: { id: string }) => Book | null;
type CreateShelf = ({ shelf }: { shelf: CreateShelfInput }) => Shelf;
type UpdateShelf = ({ id, updates }: { id: string; updates: UpdateShelfInput }) => Shelf | null;
type ListShelves = () => Shelf[];
type DeleteShelf = ({ id }: { id: string }) => { success: boolean };
type AddBookToShelf = ({ shelfId, bookId }: AddBookToShelfInput) => Shelf | null;
type RemoveBookFromShelf = ({ shelfId, bookId }: RemoveBookFromShelfInput) => Shelf | null;

interface Application {
  health: Health;
  createBook: CreateBook;
  updateBook: UpdateBook;
  listBooks: ListBooks;
  getBook: GetBook;
  createShelf: CreateShelf;
  updateShelf: UpdateShelf;
  listShelves: ListShelves;
  deleteShelf: DeleteShelf;
  addBookToShelf: AddBookToShelf;
  removeBookFromShelf: RemoveBookFromShelf;
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
