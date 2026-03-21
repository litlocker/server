import { Book, CreateBookInput, UpdateBookInput } from "../entities/book.d.ts";

type CreateBook = ({ book }: { book: CreateBookInput }) => Book;
type UpdateBook = ({ id, updates }: { id: string; updates: UpdateBookInput }) => Book | null;
type ListBooks = () => Book[];
type GetBook = ({ id }: { id: string }) => Book | null;

export type { CreateBook, UpdateBook, ListBooks, GetBook };
