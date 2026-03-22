import { describe, expect, it } from "vitest";
import { createApplication } from "../../../application/index.js";
import { createClockSystem } from "../../clock/system/index.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";
import { createLoggerPino } from "../../logger/pino/index.js";
import { createPersistenceInMemory } from "../../persistence/in-memory/index.js";
import { createHonoApp } from "../../server/http-hono/app.js";
import { createExpectedErrorResponse } from "./test-helpers.js";

describe("http hono shelf routes integration", () => {
  const config = {
    logger: {
      debugLogsEnabled: true,
      defaultMetadata: { serviceName: "test" },
    },
    server: {
      http: {
        address: "http://localhost:3000",
        port: 3000,
        timeoutMs: 1000,
      },
    },
    storage: {
      paths: {
        library: "/tmp/litlocker/library",
        imports: "/tmp/litlocker/imports",
        covers: "/tmp/litlocker/covers",
      },
    },
    imports: {
      maxFileSizeInBytes: 50_000_000,
      allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
      duplicateCheckEnabled: true,
    },
    database: {
      host: "localhost",
      port: 15_432,
      user: "devdb",
      password: "devpass",
      database: "devdb",
      schema: "litlocker",
      sslEnabled: false,
      poolMaxConnections: 10,
      poolIdleTimeoutMs: 30_000,
      connectionTimeoutMs: 5_000,
    },
    auth: {
      enabled: false,
      bootstrapAdminEmail: "",
      bootstrapAdminPassword: "",
      sessionSecret: "0123456789abcdef0123456789abcdef",
      sessionTtlMs: 86_400_000,
      sessionCookieName: "litlocker-session",
      sessionCookieSecure: false,
      oidc: {
        issuerUrl: "",
        clientId: "",
        clientSecret: "",
        redirectUrl: "",
        postLogoutRedirectUrl: "",
        scopes: ["openid", "profile", "email"],
        requirePkce: true,
        discoveryTimeoutMs: 5_000,
      },
    },
    metadataProviders: {
      enabledProviders: ["open-library"],
      lookupTimeoutMs: 5_000,
      defaultLanguage: "en",
    },
  };

  const createTestApp = () => {
    const clock = createClockSystem();
    const logger = createLoggerPino({ config: config.logger });
    const persistence = createPersistenceInMemory();
    const idGenerator = createIdGeneratorSystem();
    const application = createApplication({ clock, config, persistence, idGenerator, logger });

    return createHonoApp({
      application,
      config: config.server,
      logger,
    });
  };

  it("should create, list, update, and delete shelves through the API", async () => {
    const app = createTestApp();

    const createResponse = await app.request(
      new Request("http://localhost/shelves", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Favorites",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);
    const { shelf: createdShelf } = await createResponse.json();

    expect(createdShelf).toEqual({
      id: createdShelf.id,
      kind: "manual",
      name: "Favorites",
      description: "",
      bookIds: [],
    });

    const listResponse = await app.request("http://localhost/shelves");

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toEqual({
      shelves: [createdShelf],
    });

    const updateResponse = await app.request(
      new Request(`http://localhost/shelves/${createdShelf.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "Priority reading list",
        }),
      }),
    );

    expect(updateResponse.status).toBe(200);
    const { shelf: updatedShelf } = await updateResponse.json();

    expect(updatedShelf).toEqual({
      ...createdShelf,
      description: "Priority reading list",
    });

    const deleteResponse = await app.request(
      new Request(`http://localhost/shelves/${createdShelf.id}`, {
        method: "DELETE",
      }),
    );

    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toEqual({
      success: true,
    });

    const listAfterDeleteResponse = await app.request("http://localhost/shelves");

    expect(listAfterDeleteResponse.status).toBe(200);
    await expect(listAfterDeleteResponse.json()).resolves.toEqual({
      shelves: [],
    });
  });

  it("should add and remove a book from a shelf through the API", async () => {
    const app = createTestApp();

    const createBookResponse = await app.request(
      new Request("http://localhost/books", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "The Left Hand of Darkness",
        }),
      }),
    );
    const { book } = await createBookResponse.json();

    const createShelfResponse = await app.request(
      new Request("http://localhost/shelves", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Favorites",
        }),
      }),
    );
    const { shelf } = await createShelfResponse.json();

    const addResponse = await app.request(
      new Request(`http://localhost/shelves/${shelf.id}/books/${book.id}`, {
        method: "POST",
      }),
    );

    expect(addResponse.status).toBe(200);
    const { shelf: shelfWithBook } = await addResponse.json();

    expect(shelfWithBook).toEqual({
      ...shelf,
      bookIds: [book.id],
    });

    const removeResponse = await app.request(
      new Request(`http://localhost/shelves/${shelf.id}/books/${book.id}`, {
        method: "DELETE",
      }),
    );

    expect(removeResponse.status).toBe(200);
    await expect(removeResponse.json()).resolves.toEqual({
      shelf: {
        ...shelf,
        bookIds: [],
      },
    });
  });

  it("should reject invalid create and update payloads through the API", async () => {
    const app = createTestApp();

    const invalidCreateResponse = await app.request(
      new Request("http://localhost/shelves", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "Priority reading list",
        }),
      }),
    );

    expect(invalidCreateResponse.status).toBe(400);
    await expect(invalidCreateResponse.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "invalid_shelf_payload",
        message: "Invalid shelf payload",
        details: {
          resource: "shelf",
        },
        errors: ["/ must have required property 'name'"],
      }),
    });

    const createShelfResponse = await app.request(
      new Request("http://localhost/shelves", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Favorites",
        }),
      }),
    );
    const { shelf } = await createShelfResponse.json();

    const invalidUpdateResponse = await app.request(
      new Request(`http://localhost/shelves/${shelf.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(invalidUpdateResponse.status).toBe(400);
    await expect(invalidUpdateResponse.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "invalid_shelf_payload",
        message: "Invalid shelf payload",
        details: {
          resource: "shelf",
        },
        errors: ["/ must NOT have fewer than 1 properties"],
      }),
    });
  });
});
