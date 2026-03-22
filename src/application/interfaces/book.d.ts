import { Book, CreateBookInput, UpdateBookInput } from "../entities/book.d.ts";
import { Awaitable } from "./result.d.ts";

interface ListBooksInput {
  search?: string;
  title?: string;
  author?: string;
  tag?: string;
  shelfId?: string;
}

type CreateBook = ({ book }: { book: CreateBookInput }) => Awaitable<Book>;
type UpdateBook = ({
  id,
  updates,
}: {
  id: string;
  updates: UpdateBookInput;
}) => Awaitable<Book | null>;
type ListBooks = ({ filters }: { filters?: ListBooksInput }) => Awaitable<Book[]>;
type GetBook = ({ id }: { id: string }) => Awaitable<Book | null>;
interface BookFileAccess {
  bookId: string;
  fileName: string;
  format: string;
  mimeType: string;
  contents: Uint8Array;
}
type GetBookFileAccess = ({ id }: { id: string }) => Awaitable<BookFileAccess | null>;

export type {
  ListBooksInput,
  BookFileAccess,
  CreateBook,
  UpdateBook,
  ListBooks,
  GetBook,
  GetBookFileAccess,
};
