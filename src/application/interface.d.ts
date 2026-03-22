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
  SaveReadingProgress as SaveReadingProgressFn,
} from "./interfaces/reading-progress.d.ts";
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
type ListBooks = (input?: { filters?: ListBooksInput }) => Book[];
type GetBook = ({ id }: { id: string }) => Book | null;
type GetBookFileAccess = GetBookFileAccessFn;
type CreateShelf = ({ shelf }: { shelf: CreateShelfInput }) => Shelf;
type UpdateShelf = ({ id, updates }: { id: string; updates: UpdateShelfInput }) => Shelf | null;
type ListShelves = () => Shelf[];
type DeleteShelf = ({ id }: { id: string }) => { success: boolean };
type AddBookToShelf = ({ shelfId, bookId }: AddBookToShelfInput) => Shelf | null;
type RemoveBookFromShelf = ({ shelfId, bookId }: RemoveBookFromShelfInput) => Shelf | null;
type CreateImportJob = ({ job }: { job: CreateImportJobInput }) => ImportJob;
type IngestImportUpload = ({ upload }: { upload: IngestImportUploadInput }) => ImportJob;
type ReviewImportJob = ({ id, metadataCandidateIndex }: ReviewImportJobInput) => ImportJob | null;
type ListImportJobs = () => ImportJob[];
type GetImportJob = ({ id }: { id: string }) => ImportJob | null;
type FinalizeImportJob = ({ id }: { id: string }) => ImportJob | null;
type SaveReadingProgress = SaveReadingProgressFn;
type GetReadingProgress = GetReadingProgressFn;

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
