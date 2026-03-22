type BookLibraryStatus = "draft" | "ready" | "archived";
type BookReadingStatus = "unread" | "started" | "finished";

interface BookIdentifiers {
  isbn10: string;
  isbn13: string;
  asin: string;
  goodreadsId: string;
  googleBooksId: string;
}

interface BookCover {
  sourcePath: string;
  thumbnailPath: string;
  mimeType: string;
  dominantColor: string;
}

interface Book {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  language: string;
  authors: string[];
  tags: string[];
  seriesName: string;
  seriesNumber: string;
  cover: BookCover;
  identifiers: BookIdentifiers;
  filePath: string;
  libraryStatus: BookLibraryStatus;
  readingStatus: BookReadingStatus;
}

interface CreateBookInput {
  title: string;
  subtitle?: string;
  description?: string;
  language?: string;
  authors?: string[];
  tags?: string[];
  seriesName?: string;
  seriesNumber?: string;
  cover?: Partial<BookCover>;
  identifiers?: Partial<BookIdentifiers>;
  filePath?: string;
  libraryStatus?: BookLibraryStatus;
  readingStatus?: BookReadingStatus;
}

interface UpdateBookInput {
  title?: string;
  subtitle?: string;
  description?: string;
  language?: string;
  authors?: string[];
  tags?: string[];
  seriesName?: string;
  seriesNumber?: string;
  cover?: Partial<BookCover>;
  identifiers?: Partial<BookIdentifiers>;
  filePath?: string;
  libraryStatus?: BookLibraryStatus;
  readingStatus?: BookReadingStatus;
}

export type {
  BookLibraryStatus,
  BookReadingStatus,
  BookIdentifiers,
  BookCover,
  Book,
  CreateBookInput,
  UpdateBookInput,
};
