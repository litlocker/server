import { Awaitable } from "./result.d.ts";

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

type CreateShelf = ({ shelf }: { shelf: CreateShelfInput }) => Awaitable<Shelf>;
type UpdateShelf = ({
  id,
  updates,
}: {
  id: string;
  updates: UpdateShelfInput;
}) => Awaitable<Shelf | null>;
type ListShelves = () => Awaitable<Shelf[]>;
type GetShelf = ({ id }: { id: string }) => Awaitable<Shelf | null>;
type DeleteShelf = ({ id }: { id: string }) => Awaitable<{ success: boolean }>;
type AddBookToShelf = ({ shelfId, bookId }: AddBookToShelfInput) => Awaitable<Shelf | null>;
type RemoveBookFromShelf = ({
  shelfId,
  bookId,
}: RemoveBookFromShelfInput) => Awaitable<Shelf | null>;

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
