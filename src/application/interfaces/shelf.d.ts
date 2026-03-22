type ShelfKind = "manual";

interface Shelf {
  id: string;
  kind: ShelfKind;
  name: string;
  description: string;
  bookIds: string[];
}

interface CreateShelfInput {
  name: string;
  description?: string;
}

interface UpdateShelfInput {
  name?: string;
  description?: string;
}

interface AddBookToShelfInput {
  shelfId: string;
  bookId: string;
}

interface RemoveBookFromShelfInput {
  shelfId: string;
  bookId: string;
}

type CreateShelf = ({ shelf }: { shelf: CreateShelfInput }) => Shelf;
type UpdateShelf = ({ id, updates }: { id: string; updates: UpdateShelfInput }) => Shelf | null;
type ListShelves = () => Shelf[];
type GetShelf = ({ id }: { id: string }) => Shelf | null;
type DeleteShelf = ({ id }: { id: string }) => { success: boolean };
type AddBookToShelf = ({ shelfId, bookId }: AddBookToShelfInput) => Shelf | null;
type RemoveBookFromShelf = ({ shelfId, bookId }: RemoveBookFromShelfInput) => Shelf | null;

export type {
  ShelfKind,
  Shelf,
  CreateShelfInput,
  UpdateShelfInput,
  AddBookToShelfInput,
  RemoveBookFromShelfInput,
  CreateShelf,
  UpdateShelf,
  ListShelves,
  GetShelf,
  DeleteShelf,
  AddBookToShelf,
  RemoveBookFromShelf,
};
