type ReadingProgressFormat = "epub" | "pdf" | "comic";

interface ReadingProgress {
  id: string;
  bookId: string;
  userId: string;
  format: ReadingProgressFormat;
  locator: string;
  percentage: string;
  createdAt: string;
  updatedAt: string;
}

export type { ReadingProgressFormat, ReadingProgress };
