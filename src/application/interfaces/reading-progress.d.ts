import { ReadingProgress, ReadingProgressFormat } from "../entities/reading-progress.d.ts";
import { CurrentUserInput } from "./user.d.ts";

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
}) => ReadingProgress | null;
type GetReadingProgress = ({
  bookId,
  userId,
}: {
  bookId: string;
  userId: string;
}) => ReadingProgress | null;
type SaveCurrentUserReadingProgress = ({
  currentUser,
  progress,
}: {
  currentUser: CurrentUserInput;
  progress: Omit<SaveReadingProgressInput, "userId">;
}) => ReadingProgress | null;
type GetCurrentUserReadingProgress = ({
  currentUser,
  bookId,
}: {
  currentUser: CurrentUserInput;
  bookId: string;
}) => ReadingProgress | null;

export type {
  ReadingProgress,
  ReadingProgressFormat,
  SaveReadingProgressInput,
  SaveReadingProgress,
  GetReadingProgress,
  SaveCurrentUserReadingProgress,
  GetCurrentUserReadingProgress,
};
