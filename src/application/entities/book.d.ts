type BookStatus = "draft" | "ready" | "archived";

interface BookIdentifiers {
  isbn10: string;
  isbn13: string;
  asin: string;
  goodreadsId: string;
  googleBooksId: string;
}

interface Book {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  language: string;
  authors: string[];
  seriesName: string;
  seriesNumber: string;
  identifiers: BookIdentifiers;
  status: BookStatus;
}

interface CreateBookInput {
  title: string;
  subtitle?: string;
  description?: string;
  language?: string;
  authors?: string[];
  seriesName?: string;
  seriesNumber?: string;
  identifiers?: Partial<BookIdentifiers>;
  status?: BookStatus;
}

interface UpdateBookInput {
  title?: string;
  subtitle?: string;
  description?: string;
  language?: string;
  authors?: string[];
  seriesName?: string;
  seriesNumber?: string;
  identifiers?: Partial<BookIdentifiers>;
  status?: BookStatus;
}

export type { BookStatus, BookIdentifiers, Book, CreateBookInput, UpdateBookInput };
