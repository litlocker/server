interface Shelf {
  id: string;
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

type CreateShelf = ({ shelf }: { shelf: CreateShelfInput }) => Shelf;
type UpdateShelf = ({ id, updates }: { id: string; updates: UpdateShelfInput }) => Shelf | null;
type ListShelves = () => Shelf[];
type GetShelf = ({ id }: { id: string }) => Shelf | null;
type DeleteShelf = ({ id }: { id: string }) => { success: boolean };

export type {
  Shelf,
  CreateShelfInput,
  UpdateShelfInput,
  CreateShelf,
  UpdateShelf,
  ListShelves,
  GetShelf,
  DeleteShelf,
};
