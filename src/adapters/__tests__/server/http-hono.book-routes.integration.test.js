import { describe, expect, it } from "vitest";
import { createApplication } from "../../../application/index.js";
import { createClockSystem } from "../../clock/system/index.js";
import { createIdGeneratorSystem } from "../../id-generator/system/index.js";
import { createLoggerPino } from "../../logger/pino/index.js";
import { createPersistenceInMemory } from "../../persistence/in-memory/index.js";
import { createHonoApp } from "../../server/http-hono/app.js";

describe("http hono book routes integration", () => {
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
    auth: {
      enabled: false,
      bootstrapAdminEmail: "",
      bootstrapAdminPassword: "",
      sessionTtlMs: 86_400_000,
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

  it("should create, list, fetch, and update books through the API", async () => {
    const app = createTestApp();

    const createResponse = await app.request(
      new Request("http://localhost/books", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "The Left Hand of Darkness",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
        }),
      }),
    );

    expect(createResponse.status).toBe(201);
    const { book: createdBook } = await createResponse.json();

    expect(createdBook).toEqual({
      id: createdBook.id,
      title: "The Left Hand of Darkness",
      subtitle: "",
      description: "",
      language: "",
      authors: ["Ursula K. Le Guin"],
      tags: ["science-fiction"],
      seriesName: "",
      seriesNumber: "",
      cover: {
        sourcePath: "",
        thumbnailPath: "",
        mimeType: "",
        dominantColor: "",
      },
      identifiers: {
        isbn10: "",
        isbn13: "",
        asin: "",
        goodreadsId: "",
        googleBooksId: "",
      },
      filePath: "",
      libraryStatus: "draft",
      readingStatus: "unread",
    });

    const listResponse = await app.request("http://localhost/books");

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toEqual({
      books: [createdBook],
    });

    const getResponse = await app.request(`http://localhost/books/${createdBook.id}`);

    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({
      book: createdBook,
    });

    const updateResponse = await app.request(
      new Request(`http://localhost/books/${createdBook.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "A landmark science fiction novel",
          seriesName: "Hainish Cycle",
        }),
      }),
    );

    expect(updateResponse.status).toBe(200);
    const { book: updatedBook } = await updateResponse.json();

    expect(updatedBook).toEqual({
      ...createdBook,
      description: "A landmark science fiction novel",
      seriesName: "Hainish Cycle",
    });

    const getUpdatedResponse = await app.request(`http://localhost/books/${createdBook.id}`);

    expect(getUpdatedResponse.status).toBe(200);
    await expect(getUpdatedResponse.json()).resolves.toEqual({
      book: updatedBook,
    });
  });

  it("should reject invalid create and update payloads through the API", async () => {
    const app = createTestApp();

    const invalidCreateResponse = await app.request(
      new Request("http://localhost/books", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          authors: ["Ursula K. Le Guin"],
        }),
      }),
    );

    expect(invalidCreateResponse.status).toBe(400);
    await expect(invalidCreateResponse.json()).resolves.toEqual({
      message: "Invalid book payload",
      errors: ["/ must have required property 'title'"],
    });

    const invalidUpdateResponse = await app.request(
      new Request("http://localhost/books/book-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(invalidUpdateResponse.status).toBe(400);
    await expect(invalidUpdateResponse.json()).resolves.toEqual({
      message: "Invalid book payload",
      errors: ["/ must NOT have fewer than 1 properties"],
    });
  });

  it("should return 404 for missing books through the API", async () => {
    const app = createTestApp();

    const getResponse = await app.request("http://localhost/books/missing-book-id");

    expect(getResponse.status).toBe(404);
    await expect(getResponse.json()).resolves.toEqual({
      message: "Book not found",
    });

    const patchResponse = await app.request(
      new Request("http://localhost/books/missing-book-id", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "Updated description",
        }),
      }),
    );

    expect(patchResponse.status).toBe(404);
    await expect(patchResponse.json()).resolves.toEqual({
      message: "Book not found",
    });
  });

  it("should filter books through GET /books query params", async () => {
    const app = createTestApp();

    const firstCreateResponse = await app.request(
      new Request("http://localhost/books", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "The Left Hand of Darkness",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
        }),
      }),
    );
    const { book: firstBook } = await firstCreateResponse.json();

    const secondCreateResponse = await app.request(
      new Request("http://localhost/books", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "A Wizard of Earthsea",
          authors: ["Ursula K. Le Guin"],
          tags: ["fantasy"],
        }),
      }),
    );
    const { book: secondBook } = await secondCreateResponse.json();

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

    await app.request(
      new Request(`http://localhost/shelves/${shelf.id}/books/${firstBook.id}`, {
        method: "POST",
      }),
    );

    const response = await app.request(
      `http://localhost/books?search=darkness&author=ursula&tag=science-fiction&shelfId=${shelf.id}`,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      books: [firstBook],
    });

    const titleResponse = await app.request("http://localhost/books?title=earthsea");

    expect(titleResponse.status).toBe(200);
    await expect(titleResponse.json()).resolves.toEqual({
      books: [secondBook],
    });

    const identifierSearchResponse = await app.request("http://localhost/books?search=earthsea");

    expect(identifierSearchResponse.status).toBe(200);
    await expect(identifierSearchResponse.json()).resolves.toEqual({
      books: [secondBook],
    });
  });
});
