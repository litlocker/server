import { ReadingProgress, ReadingProgressFormat } from "../entities/reading-progress.d.ts";

interface SaveReadingProgressInput {
  bookId: string;
  userId: string;
  format: ReadingProgressFormat;
  locator?: string;
  percentage?: string;
}

type SaveReadingProgress = ({
  progress,
}: {
  progress: SaveReadingProgressInput;
}) => ReadingProgress;
type GetReadingProgress = ({
  bookId,
  userId,
}: {
  bookId: string;
  userId: string;
}) => ReadingProgress | null;

export type {
  ReadingProgress,
  ReadingProgressFormat,
  SaveReadingProgressInput,
  SaveReadingProgress,
  GetReadingProgress,
};
