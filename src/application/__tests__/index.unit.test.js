import { describe, expect, it } from "vitest";
import { createClockSystem } from "../../adapters/clock/system/index.js";
import { createDataStoreInMemory } from "../../adapters/data-store/in-memory/index.js";
import { createIdGeneratorSystem } from "../../adapters/id-generator/system/index.js";
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
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  describe("foundation functions", () => {
    it("should expose the health function on the application", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application).toHaveProperty("health");
    });

    it("should return an ok health status", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application.health()).toEqual({
        success: true,
        data: {
          status: "ok",
        },
      });
    });
  });

  describe("book functions", () => {
    it("should expose book functions on the application", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application).toHaveProperty("createBook");
      expect(application).toHaveProperty("updateBook");
      expect(application).toHaveProperty("listBooks");
      expect(application).toHaveProperty("getBook");
    });

    it("should create and list books", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
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
      });
      expect(firstBook.id).toEqual(expect.any(String));
      expect(secondBook).toEqual({
        id: secondBook.id,
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
      });
      expect(application.listBooks()).toEqual([firstBook, secondBook]);
    });

    it("should fetch a book by id", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
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
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application.getBook({ id: "missing-book-id" })).toBeNull();
    });

    it("should update an existing book", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const book = application.createBook({
        book: {
          title: "The Tombs of Atuan",
          subtitle: "Earthsea Cycle",
          description: "Original description",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["fantasy"],
          seriesName: "Earthsea Cycle",
          seriesNumber: "2",
          cover: {
            sourcePath: "/covers/tombs-of-atuan.jpg",
            mimeType: "image/jpeg",
          },
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
          authors: ["Ursula K. Le Guin", "Another Contributor"],
          tags: ["fantasy", "classic"],
          cover: {
            thumbnailPath: "/covers/thumbnails/tombs-of-atuan.jpg",
            dominantColor: "#445566",
          },
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
        authors: ["Ursula K. Le Guin", "Another Contributor"],
        tags: ["fantasy", "classic"],
        seriesName: "Earthsea Cycle",
        seriesNumber: "2",
        cover: {
          sourcePath: "/covers/tombs-of-atuan.jpg",
          thumbnailPath: "/covers/thumbnails/tombs-of-atuan.jpg",
          mimeType: "image/jpeg",
          dominantColor: "#445566",
        },
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
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
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
      });
    });

    it("should store simple author and series metadata on books", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const book = application.createBook({
        book: {
          title: "The Farthest Shore",
          authors: ["Ursula K. Le Guin"],
          seriesName: "Earthsea Cycle",
          seriesNumber: "3",
        },
      });

      expect(book).toEqual({
        id: book.id,
        title: "The Farthest Shore",
        subtitle: "",
        description: "",
        language: "",
        authors: ["Ursula K. Le Guin"],
        tags: [],
        seriesName: "Earthsea Cycle",
        seriesNumber: "3",
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
      });
    });

    it("should store simple tags and cover metadata on books", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        dataStore: createDataStoreInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const book = application.createBook({
        book: {
          title: "The Wind-Up Bird Chronicle",
          tags: ["fiction", "japanese-literature"],
          cover: {
            sourcePath: "/covers/wind-up-bird.png",
            thumbnailPath: "/covers/thumbnails/wind-up-bird.png",
            mimeType: "image/png",
            dominantColor: "#223344",
          },
        },
      });

      expect(book).toEqual({
        id: book.id,
        title: "The Wind-Up Bird Chronicle",
        subtitle: "",
        description: "",
        language: "",
        authors: [],
        tags: ["fiction", "japanese-literature"],
        seriesName: "",
        seriesNumber: "",
        cover: {
          sourcePath: "/covers/wind-up-bird.png",
          thumbnailPath: "/covers/thumbnails/wind-up-bird.png",
          mimeType: "image/png",
          dominantColor: "#223344",
        },
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
