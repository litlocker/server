import { createClockSystem } from "../../../adapters/clock/system/index.js";
import { createIdGeneratorSystem } from "../../../adapters/id-generator/system/index.js";
import { runAuthUnitTests } from "../../../application/interfaces/test-runners/auth.unit.test-runner.js";
import { createAuthOidc } from "../../auth/oidc/index.js";

const createTestAuthOidc = () => {
  return createAuthOidc({
    clock: createClockSystem(),
    config: {
      auth: {
        enabled: true,
        bootstrapAdminEmail: "",
        bootstrapAdminPassword: "",
        sessionSecret: "0123456789abcdef0123456789abcdef",
        sessionTtlMs: 86_400_000,
        sessionCookieName: "litlocker-session",
        sessionCookieSecure: false,
        rateLimit: {
          windowMs: 60_000,
          maxRequests: 10,
        },
        oidc: {
          issuerUrl: "https://id.example.com/realms/litlocker",
          clientId: "litlocker-web",
          clientSecret: "super-secret",
          redirectUrl: "https://library.example.com/auth/callback",
          postLogoutRedirectUrl: "https://library.example.com",
          scopes: ["openid", "profile", "email"],
          requirePkce: true,
          discoveryTimeoutMs: 5_000,
        },
      },
    },
    idGenerator: createIdGeneratorSystem(),
  });
};

runAuthUnitTests(createTestAuthOidc);
