interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface CreateUserInput {
  email: string;
  displayName?: string;
  role?: string;
}

type CreateUser = ({ user }: { user: CreateUserInput }) => User;
type UpdateUser = ({ id, updates }: { id: string; updates: Partial<User> }) => User | null;
type ListUsers = () => User[];
type GetUser = ({ id }: { id: string }) => User | null;

export type { User, CreateUserInput, CreateUser, UpdateUser, ListUsers, GetUser };
