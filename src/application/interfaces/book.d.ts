import { Book, CreateBookInput, UpdateBookInput } from "../entities/book.d.ts";

interface ListBooksInput {
  search?: string;
  title?: string;
  author?: string;
  tag?: string;
  shelfId?: string;
}

type CreateBook = ({ book }: { book: CreateBookInput }) => Book;
type UpdateBook = ({ id, updates }: { id: string; updates: UpdateBookInput }) => Book | null;
type ListBooks = ({ filters }: { filters?: ListBooksInput }) => Book[];
type GetBook = ({ id }: { id: string }) => Book | null;
interface BookFileAccess {
  bookId: string;
  fileName: string;
  format: string;
  mimeType: string;
  contents: Uint8Array;
}
type GetBookFileAccess = ({ id }: { id: string }) => BookFileAccess | null;

export type {
  ListBooksInput,
  BookFileAccess,
  CreateBook,
  UpdateBook,
  ListBooks,
  GetBook,
  GetBookFileAccess,
};
