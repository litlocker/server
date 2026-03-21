type BookRecord = {
  id: string;
} & Record<string, unknown>;

type CreateBookRecord = ({ book }: { book: Record<string, unknown> }) => BookRecord;
type UpdateBookRecord = ({
  id,
  updates,
}: {
  id: string;
  updates: Record<string, unknown>;
}) => BookRecord | null;
type ListBookRecords = () => BookRecord[];
type GetBookRecord = ({ id }: { id: string }) => BookRecord | null;

interface DataStore {
  createBook: CreateBookRecord;
  updateBook: UpdateBookRecord;
  listBooks: ListBookRecords;
  getBook: GetBookRecord;
}

type CreateDataStore = () => DataStore;

export type { BookRecord, DataStore, CreateDataStore };
