import { Book, CreateBookInput, UpdateBookInput } from "../entities/book.d.ts";

type CreateBookRecord = ({ book }: { book: Book }) => Book;
type UpdateBookRecord = ({
  id,
  updates,
}: {
  id: string;
  updates: Partial<Book> | UpdateBookInput;
}) => Book | null;
type ListBookRecords = () => Book[];
type GetBookRecord = ({ id }: { id: string }) => Book | null;

interface DataStore {
  createBook: CreateBookRecord;
  updateBook: UpdateBookRecord;
  listBooks: ListBookRecords;
  getBook: GetBookRecord;
}

type CreateDataStore = () => DataStore;

export type { DataStore, CreateDataStore };
