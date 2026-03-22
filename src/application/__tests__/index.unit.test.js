import { describe, expect, it } from "vitest";
import { createClockSystem } from "../../adapters/clock/system/index.js";
import { createIdGeneratorSystem } from "../../adapters/id-generator/system/index.js";
import { createPersistenceInMemory } from "../../adapters/persistence/in-memory/index.js";
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
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };

  describe("foundation functions", () => {
    it("should expose the health function on the application", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application).toHaveProperty("health");
    });

    it("should return an aggregated ok health status", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application.health()).toEqual({
        success: true,
        data: {
          status: "ok",
          details: {
            checks: {
              clock: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              persistence: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              idGenerator: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              logger: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
            },
          },
        },
      });
    });

    it("should return failure when a dependency health check fails", () => {
      const application = createApplication({
        clock: {
          now: () => new Date(),
          checkHealth: () => ({
            success: false,
            error: {
              code: "clock_unavailable",
              message: "Clock is unavailable",
              details: {
                dependency: "clock",
              },
            },
          }),
        },
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application.health()).toEqual({
        success: false,
        error: {
          code: "dependency_unavailable",
          message: "One or more application dependencies are unavailable",
          details: {
            checks: {
              clock: {
                success: false,
                error: {
                  code: "clock_unavailable",
                  message: "Clock is unavailable",
                  details: {
                    dependency: "clock",
                  },
                },
              },
              persistence: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              idGenerator: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              logger: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
            },
          },
        },
      });
    });
  });

  describe("book functions", () => {
    it("should expose book functions on the application", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
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
        persistence: createPersistenceInMemory(),
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

    it("should filter books by title, author, tag, and shelf membership", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const firstBook = application.createBook({
        book: {
          title: "The Left Hand of Darkness",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction", "classic"],
        },
      });
      const secondBook = application.createBook({
        book: {
          title: "A Wizard of Earthsea",
          authors: ["Ursula K. Le Guin"],
          tags: ["fantasy"],
        },
      });
      const thirdBook = application.createBook({
        book: {
          title: "Kindred",
          authors: ["Octavia E. Butler"],
          tags: ["science-fiction"],
        },
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Favorites",
        },
      });

      application.addBookToShelf({
        shelfId: shelf.id,
        bookId: firstBook.id,
      });
      application.addBookToShelf({
        shelfId: shelf.id,
        bookId: secondBook.id,
      });

      expect(
        application.listBooks({
          filters: {
            title: "earthsea",
          },
        }),
      ).toEqual([secondBook]);
      expect(
        application.listBooks({
          filters: {
            author: "octavia",
          },
        }),
      ).toEqual([thirdBook]);
      expect(
        application.listBooks({
          filters: {
            tag: "science-fiction",
          },
        }),
      ).toEqual([firstBook, thirdBook]);
      expect(
        application.listBooks({
          filters: {
            shelfId: shelf.id,
          },
        }),
      ).toEqual([firstBook, secondBook]);
      expect(
        application.listBooks({
          filters: {
            author: "ursula",
            tag: "fantasy",
            shelfId: shelf.id,
          },
        }),
      ).toEqual([secondBook]);
    });

    it("should fetch a book by id", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
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
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application.getBook({ id: "missing-book-id" })).toBeNull();
    });

    it("should update an existing book", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
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
        persistence: createPersistenceInMemory(),
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
        persistence: createPersistenceInMemory(),
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
        persistence: createPersistenceInMemory(),
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
        persistence: createPersistenceInMemory(),
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

  describe("shelf functions", () => {
    it("should expose shelf functions on the application", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application).toHaveProperty("createShelf");
      expect(application).toHaveProperty("updateShelf");
      expect(application).toHaveProperty("listShelves");
      expect(application).toHaveProperty("deleteShelf");
      expect(application).toHaveProperty("addBookToShelf");
      expect(application).toHaveProperty("removeBookFromShelf");
    });

    it("should create and list shelves", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const firstShelf = application.createShelf({
        shelf: {
          name: "Favorites",
        },
      });
      const secondShelf = application.createShelf({
        shelf: {
          name: "To Read",
          description: "Priority reading list",
        },
      });

      expect(firstShelf).toEqual({
        id: firstShelf.id,
        kind: "manual",
        name: "Favorites",
        description: "",
        bookIds: [],
      });
      expect(firstShelf.id).toEqual(expect.any(String));
      expect(secondShelf).toEqual({
        id: secondShelf.id,
        kind: "manual",
        name: "To Read",
        description: "Priority reading list",
        bookIds: [],
      });
      expect(application.listShelves()).toEqual([firstShelf, secondShelf]);
    });

    it("should update an existing shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Weekend Reads",
          description: "Short books",
        },
      });

      const updatedShelf = application.updateShelf({
        id: shelf.id,
        updates: {
          name: "Weekend Reading",
        },
      });

      expect(updatedShelf).toEqual({
        id: shelf.id,
        kind: "manual",
        name: "Weekend Reading",
        description: "Short books",
        bookIds: [],
      });
      expect(application.listShelves()).toEqual([updatedShelf]);
    });

    it("should return null when updating a missing shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(
        application.updateShelf({
          id: "missing-shelf-id",
          updates: {
            name: "Archive",
          },
        }),
      ).toBeNull();
    });

    it("should delete an existing shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Archive",
        },
      });

      expect(application.deleteShelf({ id: shelf.id })).toEqual({
        success: true,
      });
      expect(application.listShelves()).toEqual([]);
    });

    it("should return failure when deleting a missing shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application.deleteShelf({ id: "missing-shelf-id" })).toEqual({
        success: false,
      });
    });

    it("should add a book to a shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const book = application.createBook({
        book: {
          title: "The Left Hand of Darkness",
        },
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Favorites",
        },
      });

      const updatedShelf = application.addBookToShelf({
        shelfId: shelf.id,
        bookId: book.id,
      });

      expect(updatedShelf).toEqual({
        ...shelf,
        bookIds: [book.id],
      });
      expect(application.listShelves()).toEqual([updatedShelf]);
    });

    it("should not duplicate a book when adding it to a shelf twice", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const book = application.createBook({
        book: {
          title: "A Wizard of Earthsea",
        },
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Favorites",
        },
      });

      application.addBookToShelf({
        shelfId: shelf.id,
        bookId: book.id,
      });
      const updatedShelf = application.addBookToShelf({
        shelfId: shelf.id,
        bookId: book.id,
      });

      expect(updatedShelf).toEqual({
        ...shelf,
        bookIds: [book.id],
      });
    });

    it("should return null when adding a missing book to a shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Favorites",
        },
      });

      expect(
        application.addBookToShelf({
          shelfId: shelf.id,
          bookId: "missing-book-id",
        }),
      ).toBeNull();
    });

    it("should return null when adding a book to a missing shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const book = application.createBook({
        book: {
          title: "Tehanu",
        },
      });

      expect(
        application.addBookToShelf({
          shelfId: "missing-shelf-id",
          bookId: book.id,
        }),
      ).toBeNull();
    });

    it("should remove a book from a shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const firstBook = application.createBook({
        book: {
          title: "The Tombs of Atuan",
        },
      });
      const secondBook = application.createBook({
        book: {
          title: "The Farthest Shore",
        },
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Earthsea",
        },
      });

      application.addBookToShelf({
        shelfId: shelf.id,
        bookId: firstBook.id,
      });
      application.addBookToShelf({
        shelfId: shelf.id,
        bookId: secondBook.id,
      });

      const updatedShelf = application.removeBookFromShelf({
        shelfId: shelf.id,
        bookId: firstBook.id,
      });

      expect(updatedShelf).toEqual({
        ...shelf,
        bookIds: [secondBook.id],
      });
    });

    it("should return the unchanged shelf when removing a book that is not present", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const shelf = application.createShelf({
        shelf: {
          name: "Favorites",
        },
      });

      const updatedShelf = application.removeBookFromShelf({
        shelfId: shelf.id,
        bookId: "missing-book-id",
      });

      expect(updatedShelf).toEqual(shelf);
    });

    it("should return null when removing a book from a missing shelf", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(
        application.removeBookFromShelf({
          shelfId: "missing-shelf-id",
          bookId: "book-1",
        }),
      ).toBeNull();
    });
  });
});
