import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";

describe("http hono book routes", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = {
    info: () => {},
  };

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
      status: "draft",
    };
    const application = {
      hello: vi.fn(),
      createBook: vi.fn().mockReturnValue(createdBook),
      updateBook: vi.fn(),
      listBooks: vi.fn(),
      getBook: vi.fn(),
    };
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
        status: "draft",
      },
    ];
    const application = {
      hello: vi.fn(),
      createBook: vi.fn(),
      updateBook: vi.fn(),
      listBooks: vi.fn().mockReturnValue(books),
      getBook: vi.fn(),
    };
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/books");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      books,
    });
    expect(application.listBooks).toHaveBeenCalledOnce();
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
      status: "draft",
    };
    const application = {
      hello: vi.fn(),
      createBook: vi.fn(),
      updateBook: vi.fn(),
      listBooks: vi.fn(),
      getBook: vi.fn().mockReturnValue(book),
    };
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/books/book-1");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      book,
    });
    expect(application.getBook).toHaveBeenCalledWith({ id: "book-1" });
  });

  it("should return 404 when GET /books/:id cannot find a book", async () => {
    const application = {
      hello: vi.fn(),
      createBook: vi.fn(),
      updateBook: vi.fn(),
      listBooks: vi.fn(),
      getBook: vi.fn().mockReturnValue(null),
    };
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/books/missing-book-id");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Book not found",
    });
    expect(application.getBook).toHaveBeenCalledWith({ id: "missing-book-id" });
  });
});
