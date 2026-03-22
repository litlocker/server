import { User, UserRole } from "../entities/user.d.ts";

interface CreateUserInput {
  authIssuer: string;
  authSubject: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

interface CurrentUserInput {
  authIssuer: string;
  authSubject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string;
}

type CreateUser = ({ user }: { user: CreateUserInput }) => User;
type UpdateUser = ({ id, updates }: { id: string; updates: Partial<User> }) => User | null;
type ListUsers = () => User[];
type GetUser = ({ id }: { id: string }) => User | null;

export type { User, CreateUserInput, CurrentUserInput, CreateUser, UpdateUser, ListUsers, GetUser };
