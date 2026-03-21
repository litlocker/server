interface ReadingProgress {
  id: string;
  bookId: string;
  userId: string;
  locator: string;
  percentage: string;
}

interface SaveReadingProgressInput {
  bookId: string;
  userId: string;
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

export type { ReadingProgress, SaveReadingProgressInput, SaveReadingProgress, GetReadingProgress };
