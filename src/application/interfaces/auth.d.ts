import { User } from "../entities/user.d.ts";
import { CheckHealth, Result } from "./result.d.ts";

interface AuthSession {
  id: string;
  userId: string;
  authIssuer: string;
  authSubject: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
}

interface LoginInput {
  returnToUrl: string;
}

interface LoginResult {
  authorizationUrl: string;
  state: string;
  nonce: string;
  pkceCodeVerifier: string;
  returnToUrl: string;
}

interface OidcCallbackInput {
  code: string;
  state: string;
}

interface AuthenticatedSession {
  session: AuthSession;
  user: User;
  redirectUrl: string;
}

interface VerifySessionInput {
  sessionToken: string;
}

interface LogoutInput {
  sessionToken: string;
}

interface LogoutResult {
  logoutUrl: string;
}

type Login = ({ login }: { login: LoginInput }) => Result<LoginResult>;
type HandleOidcCallback = ({
  callback,
}: {
  callback: OidcCallbackInput;
}) => Result<AuthenticatedSession>;
type VerifySession = ({ session }: { session: VerifySessionInput }) => Result<AuthenticatedSession>;
type Logout = ({ logout }: { logout: LogoutInput }) => Result<LogoutResult>;

interface AuthProvider {
  login: Login;
  handleOidcCallback: HandleOidcCallback;
  verifySession: VerifySession;
  logout: Logout;
  checkHealth: CheckHealth;
}

type CreateAuthProvider = () => AuthProvider;

export type { AuthProvider, CreateAuthProvider };
