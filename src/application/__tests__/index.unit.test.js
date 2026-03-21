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

      expect(firstBook).toMatchObject({
        title: "The Left Hand of Darkness",
      });
      expect(firstBook.id).toEqual(expect.any(String));
      expect(secondBook).toMatchObject({
        title: "A Wizard of Earthsea",
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
          description: "Original description",
        },
      });

      const updatedBook = application.updateBook({
        id: book.id,
        updates: {
          description: "Updated description",
          language: "en",
        },
      });

      expect(updatedBook).toEqual({
        id: book.id,
        title: "The Tombs of Atuan",
        description: "Updated description",
        language: "en",
      });
      expect(application.getBook({ id: book.id })).toEqual(updatedBook);
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
