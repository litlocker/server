import { Book, CreateBookInput, UpdateBookInput } from "./entities/book.d.ts";
import { GetBookFileAccess as GetBookFileAccessFn, ListBooksInput } from "./interfaces/book.d.ts";
import { Clock } from "./interfaces/clock.d.ts";
import { Config } from "./interfaces/config.d.ts";
import { FileStorage } from "./interfaces/file-storage.d.ts";
import { IdGenerator } from "./interfaces/id-generator.d.ts";
import {
  CreateImportJobInput,
  ImportJob,
  IngestImportUploadInput,
  ReviewImportJobInput,
} from "./interfaces/import-job.d.ts";
import { Logger } from "./interfaces/logger.d.ts";
import { MetadataProvider } from "./interfaces/metadata-provider.d.ts";
import { Persistence } from "./interfaces/persistence.d.ts";
import {
  GetReadingProgress as GetReadingProgressFn,
  GetCurrentUserReadingProgress as GetCurrentUserReadingProgressFn,
  SaveReadingProgress as SaveReadingProgressFn,
  SaveCurrentUserReadingProgress as SaveCurrentUserReadingProgressFn,
} from "./interfaces/reading-progress.d.ts";
import { Result, HealthStatus } from "./interfaces/result.d.ts";
import { Awaitable } from "./interfaces/result.d.ts";
import {
  AddBookToShelfInput,
  CreateShelfInput,
  RemoveBookFromShelfInput,
  Shelf,
  UpdateShelfInput,
} from "./interfaces/shelf.d.ts";

type Health = () => Awaitable<Result<HealthStatus>>;
type CreateBook = ({ book }: { book: CreateBookInput }) => Awaitable<Book>;
type UpdateBook = ({
  id,
  updates,
}: {
  id: string;
  updates: UpdateBookInput;
}) => Awaitable<Book | null>;
type ListBooks = (input?: { filters?: ListBooksInput }) => Awaitable<Book[]>;
type GetBook = ({ id }: { id: string }) => Awaitable<Book | null>;
type GetBookFileAccess = GetBookFileAccessFn;
type CreateShelf = ({ shelf }: { shelf: CreateShelfInput }) => Awaitable<Shelf>;
type UpdateShelf = ({
  id,
  updates,
}: {
  id: string;
  updates: UpdateShelfInput;
}) => Awaitable<Shelf | null>;
type ListShelves = () => Awaitable<Shelf[]>;
type DeleteShelf = ({ id }: { id: string }) => Awaitable<{ success: boolean }>;
type AddBookToShelf = ({ shelfId, bookId }: AddBookToShelfInput) => Awaitable<Shelf | null>;
type RemoveBookFromShelf = ({
  shelfId,
  bookId,
}: RemoveBookFromShelfInput) => Awaitable<Shelf | null>;
type CreateImportJob = ({ job }: { job: CreateImportJobInput }) => Awaitable<ImportJob>;
type IngestImportUpload = ({ upload }: { upload: IngestImportUploadInput }) => Awaitable<ImportJob>;
type ReviewImportJob = ({
  id,
  metadataCandidateIndex,
}: ReviewImportJobInput) => Awaitable<ImportJob | null>;
type ListImportJobs = () => Awaitable<ImportJob[]>;
type GetImportJob = ({ id }: { id: string }) => Awaitable<ImportJob | null>;
type FinalizeImportJob = ({ id }: { id: string }) => Awaitable<ImportJob | null>;
type SaveReadingProgress = SaveReadingProgressFn;
type GetReadingProgress = GetReadingProgressFn;
type SaveCurrentUserReadingProgress = SaveCurrentUserReadingProgressFn;
type GetCurrentUserReadingProgress = GetCurrentUserReadingProgressFn;

interface Application {
  health: Health;
  createBook: CreateBook;
  updateBook: UpdateBook;
  listBooks: ListBooks;
  getBook: GetBook;
  getBookFileAccess: GetBookFileAccess;
  createShelf: CreateShelf;
  updateShelf: UpdateShelf;
  listShelves: ListShelves;
  deleteShelf: DeleteShelf;
  addBookToShelf: AddBookToShelf;
  removeBookFromShelf: RemoveBookFromShelf;
  createImportJob: CreateImportJob;
  ingestImportUpload: IngestImportUpload;
  reviewImportJob: ReviewImportJob;
  listImportJobs: ListImportJobs;
  getImportJob: GetImportJob;
  finalizeImportJob: FinalizeImportJob;
  saveReadingProgress: SaveReadingProgress;
  getReadingProgress: GetReadingProgress;
  saveCurrentUserReadingProgress: SaveCurrentUserReadingProgress;
  getCurrentUserReadingProgress: GetCurrentUserReadingProgress;
}

interface Deps {
  clock: Clock;
  config: Config;
  fileStorage?: FileStorage;
  logger: Logger;
  metadataProvider?: MetadataProvider;
  persistence: Persistence;
  idGenerator: IdGenerator;
}

type CreateApplication = (deps: Deps) => Application;

export type { Application, CreateApplication };
