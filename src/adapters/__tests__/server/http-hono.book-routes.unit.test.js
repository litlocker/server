import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import {
  createApplicationMock,
  createExpectedErrorResponse,
  createLoggerMock,
} from "./test-helpers.js";

describe("http hono book routes", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = createLoggerMock();

  it("should create a book through POST /books", async () => {
    const createdBook = {
      id: "book-1",
      title: "The Left Hand of Darkness",
      subtitle: "",
      description: "",
      language: "",
      authors: [],
      tags: [],
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
    };
    const application = createApplicationMock({
      createBook: vi.fn().mockReturnValue(createdBook),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
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

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      book: createdBook,
    });
    expect(application.createBook).toHaveBeenCalledWith({
      book: {
        title: "The Left Hand of Darkness",
      },
    });
  });

  it("should reject an invalid book payload through POST /books", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "invalid_book_payload",
        message: "Invalid book payload",
        details: {
          resource: "book",
        },
        errors: ["/ must have required property 'title'"],
      }),
    });
    expect(application.createBook).not.toHaveBeenCalled();
  });

  it("should list books through GET /books", async () => {
    const books = [
      {
        id: "book-1",
        title: "A Wizard of Earthsea",
        subtitle: "",
        description: "",
        language: "",
        authors: [],
        tags: [],
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
      },
    ];
    const application = createApplicationMock({
      listBooks: vi.fn().mockReturnValue(books),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/books");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      books,
    });
    expect(application.listBooks).toHaveBeenCalledWith({
      filters: undefined,
    });
  });

  it("should pass query filters through GET /books", async () => {
    const books = [
      {
        id: "book-1",
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
      },
    ];
    const application = createApplicationMock({
      listBooks: vi.fn().mockReturnValue(books),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      "http://localhost/books?search=hainish&title=darkness&author=ursula&tag=science-fiction&shelfId=shelf-1",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      books,
    });
    expect(application.listBooks).toHaveBeenCalledWith({
      filters: {
        search: "hainish",
        title: "darkness",
        author: "ursula",
        tag: "science-fiction",
        shelfId: "shelf-1",
      },
    });
  });

  it("should update a book through PATCH /books/:id", async () => {
    const updatedBook = {
      id: "book-1",
      title: "The Tombs of Atuan",
      subtitle: "",
      description: "Updated description",
      language: "",
      authors: [],
      tags: ["fantasy"],
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
    };
    const application = createApplicationMock({
      updateBook: vi.fn().mockReturnValue(updatedBook),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/books/book-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "Updated description",
          tags: ["fantasy"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      book: updatedBook,
    });
    expect(application.updateBook).toHaveBeenCalledWith({
      id: "book-1",
      updates: {
        description: "Updated description",
        tags: ["fantasy"],
      },
    });
  });

  it("should reject an invalid book payload through PATCH /books/:id", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/books/book-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "invalid_book_payload",
        message: "Invalid book payload",
        details: {
          resource: "book",
        },
        errors: ["/ must NOT have fewer than 1 properties"],
      }),
    });
    expect(application.updateBook).not.toHaveBeenCalled();
  });

  it("should return 404 when PATCH /books/:id cannot find a book", async () => {
    const application = createApplicationMock({
      updateBook: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
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

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "book_not_found",
        message: "Book not found",
        details: {
          id: "missing-book-id",
        },
      }),
    });
    expect(application.updateBook).toHaveBeenCalledWith({
      id: "missing-book-id",
      updates: {
        description: "Updated description",
      },
    });
  });

  it("should fetch a book through GET /books/:id", async () => {
    const book = {
      id: "book-1",
      title: "The Dispossessed",
      subtitle: "",
      description: "",
      language: "",
      authors: [],
      tags: [],
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
    };
    const application = createApplicationMock({
      getBook: vi.fn().mockReturnValue(book),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/books/book-1");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      book,
    });
    expect(application.getBook).toHaveBeenCalledWith({ id: "book-1" });
  });

  it("should return 404 when GET /books/:id cannot find a book", async () => {
    const application = createApplicationMock({
      getBook: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/books/missing-book-id");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ...createExpectedErrorResponse({
        code: "book_not_found",
        message: "Book not found",
        details: {
          id: "missing-book-id",
        },
      }),
    });
    expect(application.getBook).toHaveBeenCalledWith({ id: "missing-book-id" });
  });
});
