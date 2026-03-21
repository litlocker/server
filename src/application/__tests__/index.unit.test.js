import { describe, expect, it } from "vitest";
import { createDataStoreInMemory } from "../../adapters/data-store/in-memory/index.js";
import { createApplication } from "../index.js";

describe("application", () => {
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
  };
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  describe("book functions", () => {
    it("should expose book functions on the application", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });

      expect(application).toHaveProperty("createBook");
      expect(application).toHaveProperty("updateBook");
      expect(application).toHaveProperty("listBooks");
      expect(application).toHaveProperty("getBook");
    });

    it("should create and list books", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });

      const firstBook = application.createBook({
        book: {
          title: "The Left Hand of Darkness",
        },
      });
      const secondBook = application.createBook({
        book: {
          title: "A Wizard of Earthsea",
        },
      });

      expect(firstBook).toEqual({
        id: firstBook.id,
        title: "The Left Hand of Darkness",
        subtitle: "",
        description: "",
        language: "",
        identifiers: {
          isbn10: "",
          isbn13: "",
          asin: "",
          goodreadsId: "",
          googleBooksId: "",
        },
        status: "draft",
      });
      expect(firstBook.id).toEqual(expect.any(String));
      expect(secondBook).toEqual({
        id: secondBook.id,
        title: "A Wizard of Earthsea",
        subtitle: "",
        description: "",
        language: "",
        identifiers: {
          isbn10: "",
          isbn13: "",
          asin: "",
          goodreadsId: "",
          googleBooksId: "",
        },
        status: "draft",
      });
      expect(application.listBooks()).toEqual([firstBook, secondBook]);
    });

    it("should fetch a book by id", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });
      const book = application.createBook({
        book: {
          title: "The Dispossessed",
        },
      });

      expect(application.getBook({ id: book.id })).toEqual(book);
    });

    it("should return null when the book does not exist", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });

      expect(application.getBook({ id: "missing-book-id" })).toBeNull();
    });

    it("should update an existing book", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });
      const book = application.createBook({
        book: {
          title: "The Tombs of Atuan",
          subtitle: "Earthsea Cycle",
          description: "Original description",
          language: "en",
          identifiers: {
            isbn13: "9780689845360",
          },
          status: "ready",
        },
      });

      const updatedBook = application.updateBook({
        id: book.id,
        updates: {
          description: "Updated description",
          identifiers: {
            googleBooksId: "google-books-id",
          },
        },
      });

      expect(updatedBook).toEqual({
        id: book.id,
        title: "The Tombs of Atuan",
        subtitle: "Earthsea Cycle",
        description: "Updated description",
        language: "en",
        identifiers: {
          isbn10: "",
          isbn13: "9780689845360",
          asin: "",
          goodreadsId: "",
          googleBooksId: "google-books-id",
        },
        status: "ready",
      });
      expect(application.getBook({ id: book.id })).toEqual(updatedBook);
    });

    it("should default optional book fields to empty strings", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });

      const book = application.createBook({
        book: {
          title: "Tehanu",
        },
      });

      expect(book).toEqual({
        id: book.id,
        title: "Tehanu",
        subtitle: "",
        description: "",
        language: "",
        identifiers: {
          isbn10: "",
          isbn13: "",
          asin: "",
          goodreadsId: "",
          googleBooksId: "",
        },
        status: "draft",
      });
    });

    it("should return null when updating a missing book", () => {
      const application = createApplication({
        config,
        dataStore: createDataStoreInMemory(),
        logger,
      });

      expect(
        application.updateBook({
          id: "missing-book-id",
          updates: {
            title: "Tehanu",
          },
        }),
      ).toBeNull();
    });
  });
});
