/**
 * @import {
 *   AuthenticatedSession,
 *   AuthProvider,
 *   CreateAuthProvider,
 * } from "../../../application/interfaces/auth.js";
 * @import { Clock } from "../../../application/interfaces/clock.js";
 * @import { Config } from "../../../application/interfaces/config.js";
 * @import { IdGenerator } from "../../../application/interfaces/id-generator.js";
 * @import { FailureResult, HealthStatus, SuccessResult } from "../../../application/interfaces/result.js";
 * @import { User } from "../../../application/entities/user.js";
 */

import { createHash } from "node:crypto";

/**
 * @returns {SuccessResult<HealthStatus>}
 */
const createHealthSuccessResult = () => {
  return {
    success: true,
    data: {
      status: "ok",
      details: {},
    },
  };
};

/**
 * @param {object} params
 * @param {string} params.code
 * @param {string} params.message
 * @param {Record<string, unknown>} [params.details]
 * @returns {FailureResult}
 */
const createFailureResult = ({ code, message, details = {} }) => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
};

/**
 * @param {string} value
 * @returns {string}
 */
const encodeBase64Url = (value) => {
  return Buffer.from(value).toString("base64url");
};

/**
 * @param {string} codeVerifier
 * @returns {string}
 */
const createPkceCodeChallenge = (codeVerifier) => {
  return createHash("sha256").update(codeVerifier).digest("base64url");
};

/**
 * @param {object} params
 * @param {string} params.issuerUrl
 * @param {string} params.path
 * @returns {string}
 */
const createIssuerEndpointUrl = ({ issuerUrl, path }) => {
  const baseUrl = issuerUrl.endsWith("/") ? issuerUrl : `${issuerUrl}/`;

  return new URL(path, baseUrl).toString();
};

/**
 * @param {object} params
 * @param {string} params.code
 * @returns {string}
 */
const createAuthSubject = ({ code }) => {
  return `oidc:${code}`;
};

/**
 * @param {object} params
 * @param {string} params.code
 * @returns {string}
 */
const createUserEmail = ({ code }) => {
  return `${code}@users.litlocker.local`;
};

/**
 * @param {object} params
 * @param {Pick<Config, "auth">} params.config
 * @param {Clock} params.clock
 * @param {IdGenerator} params.idGenerator
 * @returns {AuthProvider}
 */
const createAuthOidc = ({ config, clock, idGenerator }) => {
  /** @type {Map<string, { nonce: string; pkceCodeVerifier: string; returnToUrl: string }>} */
  const pendingLogins = new Map();
  /** @type {Map<string, AuthenticatedSession>} */
  const activeSessions = new Map();

  return {
    login: ({ login }) => {
      if (!config.auth.enabled) {
        return createFailureResult({
          code: "auth_disabled",
          message: "Authentication is disabled",
        });
      }

      const state = idGenerator.generate();
      const nonce = idGenerator.generate();
      const pkceCodeVerifier = encodeBase64Url(idGenerator.generate());

      pendingLogins.set(state, {
        nonce,
        pkceCodeVerifier,
        returnToUrl: login.returnToUrl,
      });

      const authorizationUrl = new URL(
        createIssuerEndpointUrl({
          issuerUrl: config.auth.oidc.issuerUrl,
          path: "authorize",
        }),
      );

      authorizationUrl.searchParams.set("client_id", config.auth.oidc.clientId);
      authorizationUrl.searchParams.set("redirect_uri", config.auth.oidc.redirectUrl);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", config.auth.oidc.scopes.join(" "));
      authorizationUrl.searchParams.set("state", state);
      authorizationUrl.searchParams.set("nonce", nonce);

      if (config.auth.oidc.requirePkce) {
        authorizationUrl.searchParams.set("code_challenge_method", "S256");
        authorizationUrl.searchParams.set(
          "code_challenge",
          createPkceCodeChallenge(pkceCodeVerifier),
        );
      }

      return {
        success: true,
        data: {
          authorizationUrl: authorizationUrl.toString(),
          state,
          nonce,
          pkceCodeVerifier,
          returnToUrl: login.returnToUrl,
        },
      };
    },
    handleOidcCallback: ({ callback }) => {
      if (!config.auth.enabled) {
        return createFailureResult({
          code: "auth_disabled",
          message: "Authentication is disabled",
        });
      }

      const pendingLogin = pendingLogins.get(callback.state);

      if (!pendingLogin) {
        return createFailureResult({
          code: "invalid_oidc_state",
          message: "The OIDC callback state is invalid",
          details: {
            state: callback.state,
          },
        });
      }

      pendingLogins.delete(callback.state);

      const createdAt = clock.now().toISOString();
      const expiresAt = new Date(clock.now().getTime() + config.auth.sessionTtlMs).toISOString();
      const authSubject = createAuthSubject({ code: callback.code });
      const session = {
        id: idGenerator.generate(),
        userId: idGenerator.generate(),
        authIssuer: config.auth.oidc.issuerUrl,
        authSubject,
        sessionToken: idGenerator.generate(),
        createdAt,
        expiresAt,
      };
      /** @type {User} */
      const user = {
        id: session.userId,
        authIssuer: config.auth.oidc.issuerUrl,
        authSubject,
        email: createUserEmail({ code: callback.code }),
        emailVerified: true,
        displayName: `OIDC User ${callback.code.slice(0, 8)}`,
        avatarUrl: "",
        role: "member",
        createdAt,
        updatedAt: createdAt,
      };
      /** @type {AuthenticatedSession} */
      const authenticatedSession = {
        session,
        user,
        redirectUrl: pendingLogin.returnToUrl,
      };

      activeSessions.set(session.sessionToken, authenticatedSession);

      return {
        success: true,
        data: authenticatedSession,
      };
    },
    verifySession: ({ session }) => {
      if (!config.auth.enabled) {
        return createFailureResult({
          code: "auth_disabled",
          message: "Authentication is disabled",
        });
      }

      const authenticatedSession = activeSessions.get(session.sessionToken);

      if (!authenticatedSession) {
        return createFailureResult({
          code: "invalid_session",
          message: "The session token is invalid",
          details: {
            sessionToken: session.sessionToken,
          },
        });
      }

      if (new Date(authenticatedSession.session.expiresAt).getTime() <= clock.now().getTime()) {
        activeSessions.delete(session.sessionToken);

        return createFailureResult({
          code: "expired_session",
          message: "The session has expired",
          details: {
            sessionToken: session.sessionToken,
          },
        });
      }

      return {
        success: true,
        data: authenticatedSession,
      };
    },
    logout: ({ logout }) => {
      if (!config.auth.enabled) {
        return createFailureResult({
          code: "auth_disabled",
          message: "Authentication is disabled",
        });
      }

      const authenticatedSession = activeSessions.get(logout.sessionToken);

      if (!authenticatedSession) {
        return createFailureResult({
          code: "invalid_session",
          message: "The session token is invalid",
          details: {
            sessionToken: logout.sessionToken,
          },
        });
      }

      activeSessions.delete(logout.sessionToken);

      const logoutUrl = new URL(
        createIssuerEndpointUrl({
          issuerUrl: config.auth.oidc.issuerUrl,
          path: "logout",
        }),
      );

      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        config.auth.oidc.postLogoutRedirectUrl,
      );

      return {
        success: true,
        data: {
          logoutUrl: logoutUrl.toString(),
        },
      };
    },
    checkHealth: createHealthSuccessResult,
  };
};

export { createAuthOidc };
