/**
 * @import { CreateAuthProvider } from "../auth.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreateAuthProvider } createAuthProvider */
const runAuthUnitTests = (createAuthProvider) => {
  describe("auth provider", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const authProvider = createAuthProvider();

        expect(authProvider).toHaveProperty("login");
        expect(authProvider).toHaveProperty("handleOidcCallback");
        expect(authProvider).toHaveProperty("verifySession");
        expect(authProvider).toHaveProperty("logout");
        expect(authProvider).toHaveProperty("checkHealth");
      });
    });

    describe("functions", () => {
      it("should support the full login and session lifecycle", () => {
        const authProvider = createAuthProvider();

        const loginResult = authProvider.login({
          login: {
            returnToUrl: "/library",
          },
        });

        expect(loginResult.success).toBe(true);

        if (!loginResult.success) {
          return;
        }

        expect(loginResult.data.authorizationUrl).toEqual(expect.any(String));
        expect(loginResult.data.state).toEqual(expect.any(String));
        expect(loginResult.data.nonce).toEqual(expect.any(String));
        expect(loginResult.data.pkceCodeVerifier).toEqual(expect.any(String));
        expect(loginResult.data.returnToUrl).toBe("/library");

        const callbackResult = authProvider.handleOidcCallback({
          callback: {
            code: "oidc-code-123",
            state: loginResult.data.state,
          },
        });

        expect(callbackResult.success).toBe(true);

        if (!callbackResult.success) {
          return;
        }

        expect(callbackResult.data.session.id).toEqual(expect.any(String));
        expect(callbackResult.data.session.sessionToken).toEqual(expect.any(String));
        expect(callbackResult.data.user.id).toEqual(expect.any(String));
        expect(callbackResult.data.redirectUrl).toEqual(expect.any(String));

        const sessionResult = authProvider.verifySession({
          session: {
            sessionToken: callbackResult.data.session.sessionToken,
          },
        });

        expect(sessionResult).toEqual(callbackResult);

        const logoutResult = authProvider.logout({
          logout: {
            sessionToken: callbackResult.data.session.sessionToken,
          },
        });

        expect(logoutResult.success).toBe(true);

        if (!logoutResult.success) {
          return;
        }

        expect(logoutResult.data.logoutUrl).toEqual(expect.any(String));
      });

      it("should expose health status", () => {
        const authProvider = createAuthProvider();

        const result = authProvider.checkHealth();

        expect(result).toHaveProperty("success");
      });
    });
  });
};

export { runAuthUnitTests };
