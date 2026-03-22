type UserRole = "admin" | "member";

interface User {
  id: string;
  authIssuer: string;
  authSubject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type { User, UserRole };
