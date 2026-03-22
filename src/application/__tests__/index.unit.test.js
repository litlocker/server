/**
 * @import { Application } from "../interface.js"
 * @import { Config } from "../interfaces/config.js"
 * @import { FileStorage } from "../interfaces/file-storage.js"
 * @import { Logger } from "../interfaces/logger.js"
 * @import { MetadataProvider } from "../interfaces/metadata-provider.js"
 * @import { Awaitable, HealthStatus, SuccessResult } from "../interfaces/result.js"
 */

import { describe, expect, it, vi } from "vitest";
import { createClockSystem } from "../../adapters/clock/system/index.js";
import { createIdGeneratorSystem } from "../../adapters/id-generator/system/index.js";
import { createPersistenceInMemory } from "../../adapters/persistence/in-memory/index.js";
import { createApplication } from "../index.js";

describe("application", () => {
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

  /** @type {Config} */
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
  /** @type {Logger} */
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    checkHealth: () => createHealthSuccessResult(),
  };

  /**
   * The in-memory test setup is intentionally synchronous, even though the
   * application contracts now allow promise-backed adapters such as Postgres.
   *
   * @template TValue
   * @param {Awaitable<TValue>} value
   * @returns {TValue}
   */
  const expectSync = (value) => {
    if (value && typeof value === "object" && "then" in value) {
      throw new Error("Expected a synchronous value in this test setup");
    }

    return value;
  };

  /**
   * @param {Application} application
   * @param {Parameters<Application["createBook"]>[0]} input
   */
  const createBookSync = (application, input) => expectSync(application.createBook(input));

  /**
   * @param {Application} application
   * @param {Parameters<Application["createShelf"]>[0]} input
   */
  const createShelfSync = (application, input) => expectSync(application.createShelf(input));

  /**
   * @param {Application} application
   * @param {Parameters<Application["createImportJob"]>[0]} input
   */
  const createImportJobSync = (application, input) =>
    expectSync(application.createImportJob(input));

  /**
   * @param {Application} application
   * @param {Parameters<Application["ingestImportUpload"]>[0]} input
   */
  const ingestImportUploadSync = (application, input) =>
    expectSync(application.ingestImportUpload(input));

  /**
   * @returns {FileStorage}
   */
  const createTestFileStorage = () => {
    const files = new Map();

    return {
      saveFile: ({ file }) => {
        const entry = {
          path: file.path,
          name: file.name ?? "",
          mimeType: file.mimeType ?? "",
          sizeInBytes: file.contents.byteLength,
        };

        files.set(file.path, {
          ...entry,
          contents: file.contents,
        });

        return entry;
      },
      readFile: ({ file }) => {
        return files.get(file.path)?.contents ?? new Uint8Array();
      },
      deleteFile: ({ file }) => {
        return {
          success: files.delete(file.path),
        };
      },
      moveFile: ({ file }) => {
        const currentFile = files.get(file.fromPath);

        if (!currentFile) {
          throw new Error("File not found");
        }

        files.delete(file.fromPath);
        files.set(file.toPath, {
          ...currentFile,
          path: file.toPath,
        });

        return {
          path: file.toPath,
          name: currentFile.name,
          mimeType: currentFile.mimeType,
          sizeInBytes: currentFile.sizeInBytes,
        };
      },
      fileExists: ({ file }) => files.has(file.path),
      checkHealth: () => createHealthSuccessResult(),
    };
  };

  /**
   * @param {object} [params]
   * @param {ReturnType<MetadataProvider["extractMetadata"]>} [params.embeddedMetadata]
   * @param {ReturnType<MetadataProvider["lookupMetadata"]>} [params.lookupResults]
   * @returns {MetadataProvider}
   */
  const createTestMetadataProvider = ({ embeddedMetadata = null, lookupResults = [] } = {}) => {
    return {
      extractMetadata: () => embeddedMetadata,
      lookupMetadata: () => lookupResults,
      checkHealth: () => createHealthSuccessResult(),
    };
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
              fileStorage: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              metadataProvider: {
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
              fileStorage: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              metadataProvider: {
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
      expect(application).toHaveProperty("getBookFileAccess");
    });

    it("should create and list books", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const firstBook = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
        },
      });
      const secondBook = createBookSync(application, {
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
        filePath: "",
        libraryStatus: "draft",
        readingStatus: "unread",
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
        filePath: "",
        libraryStatus: "draft",
        readingStatus: "unread",
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

      const firstBook = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction", "classic"],
        },
      });
      const secondBook = createBookSync(application, {
        book: {
          title: "A Wizard of Earthsea",
          authors: ["Ursula K. Le Guin"],
          tags: ["fantasy"],
        },
      });
      const thirdBook = createBookSync(application, {
        book: {
          title: "Kindred",
          authors: ["Octavia E. Butler"],
          tags: ["science-fiction"],
        },
      });
      const shelf = createShelfSync(application, {
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

    it("should search books across basic metadata fields and combine search with filters", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const firstBook = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
          subtitle: "Hainish Cycle",
          description: "A landmark science fiction novel",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          seriesName: "Hainish Cycle",
          identifiers: {
            isbn13: "9780441478125",
          },
        },
      });
      const secondBook = createBookSync(application, {
        book: {
          title: "Kindred",
          description: "A time-travel novel",
          authors: ["Octavia E. Butler"],
          tags: ["historical-fiction"],
        },
      });
      const shelf = createShelfSync(application, {
        shelf: {
          name: "Favorites",
        },
      });

      application.addBookToShelf({
        shelfId: shelf.id,
        bookId: firstBook.id,
      });

      expect(
        application.listBooks({
          filters: {
            search: "hainish",
          },
        }),
      ).toEqual([firstBook]);
      expect(
        application.listBooks({
          filters: {
            search: "9780441478125",
          },
        }),
      ).toEqual([firstBook]);
      expect(
        application.listBooks({
          filters: {
            search: "novel",
            shelfId: shelf.id,
          },
        }),
      ).toEqual([firstBook]);
      expect(
        application.listBooks({
          filters: {
            search: "novel",
            author: "octavia",
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
      const book = createBookSync(application, {
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
      const book = createBookSync(application, {
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
          libraryStatus: "ready",
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
        filePath: "",
        libraryStatus: "ready",
        readingStatus: "unread",
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

      const book = createBookSync(application, {
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
        filePath: "",
        libraryStatus: "draft",
        readingStatus: "unread",
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

      const book = createBookSync(application, {
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
        filePath: "",
        libraryStatus: "draft",
        readingStatus: "unread",
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

      const book = createBookSync(application, {
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
        filePath: "",
        libraryStatus: "draft",
        readingStatus: "unread",
      });
    });

    it("should return null when updating a missing book", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
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

      const firstShelf = createShelfSync(application, {
        shelf: {
          name: "Favorites",
        },
      });
      const secondShelf = createShelfSync(application, {
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
      const shelf = createShelfSync(application, {
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
      const shelf = createShelfSync(application, {
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
      const book = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
        },
      });
      const shelf = createShelfSync(application, {
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
      const book = createBookSync(application, {
        book: {
          title: "A Wizard of Earthsea",
        },
      });
      const shelf = createShelfSync(application, {
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
      const shelf = createShelfSync(application, {
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
      const book = createBookSync(application, {
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
      const firstBook = createBookSync(application, {
        book: {
          title: "The Tombs of Atuan",
        },
      });
      const secondBook = createBookSync(application, {
        book: {
          title: "The Farthest Shore",
        },
      });
      const shelf = createShelfSync(application, {
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
      const shelf = createShelfSync(application, {
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

  describe("import job functions", () => {
    it("should expose import job functions on the application", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(application).toHaveProperty("createImportJob");
      expect(application).toHaveProperty("ingestImportUpload");
      expect(application).toHaveProperty("reviewImportJob");
      expect(application).toHaveProperty("listImportJobs");
      expect(application).toHaveProperty("getImportJob");
      expect(application).toHaveProperty("finalizeImportJob");
    });

    it("should create, list, and fetch import jobs", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const firstImportJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "upload",
            path: "/tmp/uploads/book-1.epub",
          },
        },
      });
      const secondImportJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/book-2.pdf",
            originalFileName: "book-2.pdf",
          },
          detectedFileType: "pdf",
        },
      });

      expect(firstImportJob).toEqual({
        id: firstImportJob.id,
        status: "queued",
        source: {
          kind: "upload",
          path: "/tmp/uploads/book-1.epub",
          originalFileName: "",
        },
        detectedFileType: "",
        metadataCandidates: [],
        selectedMetadataCandidateIndex: -1,
        duplicateDetection: {
          fileHash: "",
          duplicateImportJobIds: [],
          duplicateBookIds: [],
        },
        error: {
          code: "",
          message: "",
          details: "",
        },
      });
      expect(firstImportJob.id).toEqual(expect.any(String));
      expect(secondImportJob).toEqual({
        id: secondImportJob.id,
        status: "queued",
        source: {
          kind: "filesystem",
          path: "/library/inbox/book-2.pdf",
          originalFileName: "book-2.pdf",
        },
        detectedFileType: "pdf",
        metadataCandidates: [],
        selectedMetadataCandidateIndex: -1,
        duplicateDetection: {
          fileHash: "",
          duplicateImportJobIds: [],
          duplicateBookIds: [],
        },
        error: {
          code: "",
          message: "",
          details: "",
        },
      });
      expect(application.listImportJobs()).toEqual([firstImportJob, secondImportJob]);
      expect(application.getImportJob({ id: secondImportJob.id })).toEqual(secondImportJob);
    });

    it("should extract embedded metadata when creating an import job", () => {
      const metadataProvider = createTestMetadataProvider({
        embeddedMetadata: {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "A landmark science fiction novel",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          seriesName: "Hainish Cycle",
          seriesNumber: "4",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "/covers/left-hand.jpg",
          source: "embedded",
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        metadataProvider,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
        },
      });

      expect(importJob.metadataCandidates).toEqual([
        {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "A landmark science fiction novel",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          seriesName: "Hainish Cycle",
          seriesNumber: "4",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "/covers/left-hand.jpg",
          source: "embedded",
          confidence: "1.00",
        },
      ]);
    });

    it("should ingest an uploaded file into the temporary import area", () => {
      const fileStorage = createTestFileStorage();
      const metadataProvider = createTestMetadataProvider({
        embeddedMetadata: {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage,
        metadataProvider,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const importJob = ingestImportUploadSync(application, {
        upload: {
          name: "left-hand.epub",
          mimeType: "application/epub+zip",
          contents: new Uint8Array([1, 2, 3]),
        },
      });

      expect(importJob).toEqual({
        id: importJob.id,
        status: "queued",
        source: {
          kind: "upload",
          path: `/tmp/litlocker/imports/${importJob.id}.epub`,
          originalFileName: "left-hand.epub",
        },
        detectedFileType: "epub",
        metadataCandidates: [
          {
            title: "The Left Hand of Darkness",
            subtitle: "",
            description: "",
            language: "en",
            authors: ["Ursula K. Le Guin"],
            tags: [],
            seriesName: "",
            seriesNumber: "",
            identifiers: {
              isbn10: "",
              isbn13: "9780441478125",
              asin: "",
              goodreadsId: "",
              googleBooksId: "",
            },
            coverPath: "",
            source: "embedded",
            confidence: "1.00",
          },
        ],
        selectedMetadataCandidateIndex: -1,
        duplicateDetection: {
          fileHash: "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
          duplicateImportJobIds: [],
          duplicateBookIds: [],
        },
        error: {
          code: "",
          message: "",
          details: "",
        },
      });
      expect(
        fileStorage.fileExists({
          file: {
            path: importJob.source.path,
          },
        }),
      ).toBe(true);
      expect(application.listImportJobs()).toEqual([importJob]);
    });

    it("should append external metadata candidates after embedded extraction", () => {
      const metadataProvider = createTestMetadataProvider({
        embeddedMetadata: {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
        },
        lookupResults: [
          {
            title: "The Left Hand of Darkness",
            subtitle: "A Novel",
            description: "Expanded catalog metadata",
            language: "en",
            authors: ["Ursula K. Le Guin"],
            tags: ["science-fiction", "classic"],
            seriesName: "Hainish Cycle",
            seriesNumber: "4",
            identifiers: {
              isbn10: "",
              isbn13: "9780441478125",
              asin: "",
              goodreadsId: "18423",
              googleBooksId: "",
            },
            coverPath: "/covers/external-left-hand.jpg",
            source: "external",
          },
        ],
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        metadataProvider,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
        },
      });

      expect(importJob.metadataCandidates).toEqual([
        {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
          confidence: "1.00",
        },
        {
          title: "The Left Hand of Darkness",
          subtitle: "A Novel",
          description: "Expanded catalog metadata",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction", "classic"],
          seriesName: "Hainish Cycle",
          seriesNumber: "4",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "18423",
            googleBooksId: "",
          },
          coverPath: "/covers/external-left-hand.jpg",
          source: "external",
          confidence: "0.80",
        },
      ]);
    });

    it("should emit structured logs for metadata preparation and import creation", () => {
      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        checkHealth: () => createHealthSuccessResult(),
      };
      const metadataProvider = createTestMetadataProvider({
        embeddedMetadata: {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
        },
        lookupResults: [
          {
            title: "The Left Hand of Darkness",
            subtitle: "A Novel",
            description: "",
            language: "en",
            authors: ["Ursula K. Le Guin"],
            tags: [],
            seriesName: "",
            seriesNumber: "",
            identifiers: {
              isbn10: "",
              isbn13: "9780441478125",
              asin: "",
              goodreadsId: "",
              googleBooksId: "",
            },
            coverPath: "",
            source: "external",
          },
        ],
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        metadataProvider,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
        },
      });

      expect(logger.info).toHaveBeenCalledWith("Embedded metadata extraction completed", {
        domain: "metadata",
        operation: "extract_embedded",
        filePath: "/library/inbox/left-hand.epub",
        fileType: "epub",
        candidateCount: 1,
      });
      expect(logger.info).toHaveBeenCalledWith("External metadata lookup completed", {
        domain: "metadata",
        operation: "lookup_external",
        title: "The Left Hand of Darkness",
        authorCount: 1,
        candidateCount: 1,
      });
      expect(logger.info).toHaveBeenCalledWith("Import metadata candidates prepared", {
        domain: "import",
        operation: "prepare_metadata",
        sourceKind: "filesystem",
        sourcePath: "/library/inbox/left-hand.epub",
        detectedFileType: "epub",
        embeddedCandidateCount: 1,
        externalCandidateCount: 1,
      });
      expect(logger.info).toHaveBeenCalledWith("Import job created", {
        domain: "import",
        operation: "create_import_job",
        importJobId: expect.any(String),
        sourceKind: "filesystem",
        detectedFileType: "epub",
        metadataCandidateCount: 2,
        duplicateImportJobCount: 0,
        duplicateBookCount: 0,
      });
    });

    it("should append external metadata candidates during upload ingestion", () => {
      const fileStorage = createTestFileStorage();
      const metadataProvider = createTestMetadataProvider({
        embeddedMetadata: {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
        },
        lookupResults: [
          {
            title: "The Left Hand of Darkness",
            subtitle: "Annotated Edition",
            description: "",
            language: "en",
            authors: ["Ursula K. Le Guin"],
            tags: ["science-fiction"],
            seriesName: "",
            seriesNumber: "",
            identifiers: {
              isbn10: "",
              isbn13: "9780441478125",
              asin: "",
              goodreadsId: "18423",
              googleBooksId: "",
            },
            coverPath: "",
            source: "external",
          },
        ],
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage,
        metadataProvider,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const importJob = ingestImportUploadSync(application, {
        upload: {
          name: "left-hand.epub",
          contents: new Uint8Array([1, 2, 3]),
        },
      });

      expect(importJob.metadataCandidates).toEqual([
        {
          title: "The Left Hand of Darkness",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
          confidence: "1.00",
        },
        {
          title: "The Left Hand of Darkness",
          subtitle: "Annotated Edition",
          description: "",
          language: "en",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "9780441478125",
            asin: "",
            goodreadsId: "18423",
            googleBooksId: "",
          },
          coverPath: "",
          source: "external",
          confidence: "0.80",
        },
      ]);
    });

    it("should detect duplicate uploads by file hash", () => {
      const fileStorage = createTestFileStorage();
      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const firstImportJob = ingestImportUploadSync(application, {
        upload: {
          name: "left-hand.epub",
          contents: new Uint8Array([1, 2, 3]),
        },
      });
      const secondImportJob = ingestImportUploadSync(application, {
        upload: {
          name: "left-hand-copy.epub",
          contents: new Uint8Array([1, 2, 3]),
        },
      });

      expect(secondImportJob.duplicateDetection).toEqual({
        fileHash: "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
        duplicateImportJobIds: [firstImportJob.id],
        duplicateBookIds: [],
      });
    });

    it("should allow selecting a metadata candidate during import review", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
          metadataCandidates: [
            {
              title: "Embedded Match",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "",
                googleBooksId: "",
              },
              coverPath: "",
              source: "embedded",
              confidence: "1.00",
            },
            {
              title: "External Match",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "18423",
                googleBooksId: "",
              },
              coverPath: "",
              source: "external",
              confidence: "0.80",
            },
          ],
        },
      });

      const reviewedImportJob = application.reviewImportJob({
        id: importJob.id,
        metadataCandidateIndex: 1,
      });

      expect(reviewedImportJob).toEqual({
        ...importJob,
        status: "review",
        selectedMetadataCandidateIndex: 1,
      });
    });

    it("should return null when selecting an invalid metadata candidate during review", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
          metadataCandidates: [
            {
              title: "Embedded Match",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "",
                googleBooksId: "",
              },
              coverPath: "",
              source: "embedded",
              confidence: "1.00",
            },
          ],
        },
      });

      expect(
        application.reviewImportJob({
          id: importJob.id,
          metadataCandidateIndex: 2,
        }),
      ).toBeNull();
    });

    it("should detect duplicate books by known identifiers from metadata candidates", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const book = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
          identifiers: {
            isbn13: "9780441478125",
          },
        },
      });

      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
          metadataCandidates: [
            {
              title: "The Left Hand of Darkness",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "",
                googleBooksId: "",
              },
              coverPath: "",
              source: "embedded",
              confidence: "0.95",
            },
          ],
        },
      });

      expect(importJob.duplicateDetection).toEqual({
        fileHash: "",
        duplicateImportJobIds: [],
        duplicateBookIds: [book.id],
      });
    });

    it("should finalize an existing import job", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "upload",
            path: "/tmp/uploads/book-1.epub",
          },
          detectedFileType: "epub",
        },
      });

      const finalizedImportJob = application.finalizeImportJob({
        id: importJob.id,
      });

      expect(finalizedImportJob).toEqual({
        ...importJob,
        status: "completed",
        error: {
          code: "",
          message: "",
          details: "",
        },
      });
      expect(application.getImportJob({ id: importJob.id })).toEqual(finalizedImportJob);
    });

    it("should require review selection before finalizing an import job with metadata candidates", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
          metadataCandidates: [
            {
              title: "Embedded Match",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "",
                googleBooksId: "",
              },
              coverPath: "",
              source: "embedded",
              confidence: "1.00",
            },
          ],
        },
      });

      expect(
        application.finalizeImportJob({
          id: importJob.id,
        }),
      ).toBeNull();

      application.reviewImportJob({
        id: importJob.id,
        metadataCandidateIndex: 0,
      });

      expect(
        application.finalizeImportJob({
          id: importJob.id,
        }),
      ).toEqual({
        ...importJob,
        status: "completed",
        selectedMetadataCandidateIndex: 0,
      });
    });

    it("should store the selected metadata candidate cover during import finalization", () => {
      const fileStorage = createTestFileStorage();
      const coverContents = new Uint8Array([9, 8, 7]);

      fileStorage.saveFile({
        file: {
          path: "/tmp/litlocker/imports/embedded-cover.jpg",
          name: "embedded-cover.jpg",
          mimeType: "image/jpeg",
          contents: coverContents,
        },
      });

      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
          metadataCandidates: [
            {
              title: "Embedded Match",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "",
                googleBooksId: "",
              },
              coverPath: "/tmp/litlocker/imports/embedded-cover.jpg",
              source: "embedded",
              confidence: "1.00",
            },
          ],
        },
      });

      application.reviewImportJob({
        id: importJob.id,
        metadataCandidateIndex: 0,
      });

      const finalizedImportJob = application.finalizeImportJob({
        id: importJob.id,
      });

      expect(finalizedImportJob).toEqual({
        ...importJob,
        status: "completed",
        selectedMetadataCandidateIndex: 0,
        metadataCandidates: [
          {
            title: "Embedded Match",
            subtitle: "",
            description: "",
            language: "en",
            authors: ["Ursula K. Le Guin"],
            tags: [],
            seriesName: "",
            seriesNumber: "",
            identifiers: {
              isbn10: "",
              isbn13: "9780441478125",
              asin: "",
              goodreadsId: "",
              googleBooksId: "",
            },
            coverPath: `/tmp/litlocker/covers/${importJob.id}.jpg`,
            source: "embedded",
            confidence: "1.00",
          },
        ],
      });
      expect(
        fileStorage.fileExists({
          file: {
            path: `/tmp/litlocker/covers/${importJob.id}.jpg`,
          },
        }),
      ).toBe(true);
      expect(
        fileStorage.readFile({
          file: {
            path: `/tmp/litlocker/covers/${importJob.id}.jpg`,
          },
        }),
      ).toEqual(coverContents);
    });

    it("should leave metadata unchanged when the selected candidate has no cover to store", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const importJob = createImportJobSync(application, {
        job: {
          source: {
            kind: "filesystem",
            path: "/library/inbox/left-hand.epub",
            originalFileName: "left-hand.epub",
          },
          detectedFileType: "epub",
          metadataCandidates: [
            {
              title: "Embedded Match",
              subtitle: "",
              description: "",
              language: "en",
              authors: ["Ursula K. Le Guin"],
              tags: [],
              seriesName: "",
              seriesNumber: "",
              identifiers: {
                isbn10: "",
                isbn13: "9780441478125",
                asin: "",
                goodreadsId: "",
                googleBooksId: "",
              },
              coverPath: "",
              source: "embedded",
              confidence: "1.00",
            },
          ],
        },
      });

      application.reviewImportJob({
        id: importJob.id,
        metadataCandidateIndex: 0,
      });

      expect(
        application.finalizeImportJob({
          id: importJob.id,
        }),
      ).toEqual({
        ...importJob,
        status: "completed",
        selectedMetadataCandidateIndex: 0,
      });
    });

    it("should return null when finalizing a missing import job", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(
        application.finalizeImportJob({
          id: "missing-import-job-id",
        }),
      ).toBeNull();
    });
  });

  describe("reading progress functions", () => {
    it("should save reading progress for an existing book and user", async () => {
      const clock = {
        now: () => new Date("2026-03-22T12:00:00.000Z"),
        checkHealth: () => createHealthSuccessResult(),
      };
      const persistence = createPersistenceInMemory();
      const book = await persistence.books.create({
        record: {
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
        },
      });
      const user = await persistence.users.create({
        record: {
          id: "user-1",
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
          role: "admin",
          createdAt: "2026-03-22T00:00:00.000Z",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      });
      const application = createApplication({
        clock,
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const readingProgress = await application.saveReadingProgress({
        progress: {
          bookId: book.id,
          userId: user.id,
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        },
      });

      expect(readingProgress).toEqual({
        id: readingProgress?.id,
        bookId: "book-1",
        userId: "user-1",
        format: "epub",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
        createdAt: "2026-03-22T12:00:00.000Z",
        updatedAt: "2026-03-22T12:00:00.000Z",
      });
      expect(
        await application.getReadingProgress({
          bookId: book.id,
          userId: user.id,
        }),
      ).toEqual(readingProgress);
      expect(await application.getBook({ id: book.id })).toEqual({
        ...book,
        readingStatus: "started",
      });
    });

    it("should update existing reading progress while preserving createdAt", async () => {
      const timestamps = ["2026-03-22T12:00:00.000Z", "2026-03-22T12:15:00.000Z"];
      let timestampIndex = 0;
      const clock = {
        now: () => new Date(timestamps[timestampIndex++]),
        checkHealth: () => createHealthSuccessResult(),
      };
      const persistence = createPersistenceInMemory();

      await persistence.books.create({
        record: {
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
        },
      });
      await persistence.users.create({
        record: {
          id: "user-1",
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
          role: "admin",
          createdAt: "2026-03-22T00:00:00.000Z",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      });
      const application = createApplication({
        clock,
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const initialProgress = await application.saveReadingProgress({
        progress: {
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        },
      });
      const updatedProgress = await application.saveReadingProgress({
        progress: {
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "epubcfi(/6/8!/4/2:10)",
          percentage: "0.75",
        },
      });

      expect(updatedProgress).toEqual({
        ...initialProgress,
        locator: "epubcfi(/6/8!/4/2:10)",
        percentage: "0.75",
        updatedAt: "2026-03-22T12:15:00.000Z",
      });
      expect(await application.getBook({ id: "book-1" })).toEqual({
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
        readingStatus: "started",
      });
    });

    it("should mark a book as finished when progress reaches 100 percent", async () => {
      const persistence = createPersistenceInMemory();

      await persistence.books.create({
        record: {
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
          libraryStatus: "ready",
          readingStatus: "unread",
        },
      });
      await persistence.users.create({
        record: {
          id: "user-1",
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
          role: "admin",
          createdAt: "2026-03-22T00:00:00.000Z",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      await application.saveReadingProgress({
        progress: {
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "epubcfi(/6/18!/4/2:10)",
          percentage: "1",
        },
      });

      expect((await application.getBook({ id: "book-1" }))?.readingStatus).toBe("finished");
    });

    it("should leave archived books archived when progress is saved", async () => {
      const persistence = createPersistenceInMemory();

      await persistence.books.create({
        record: {
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
          libraryStatus: "archived",
          readingStatus: "unread",
        },
      });
      await persistence.users.create({
        record: {
          id: "user-1",
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
          role: "admin",
          createdAt: "2026-03-22T00:00:00.000Z",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      await application.saveReadingProgress({
        progress: {
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "epubcfi(/6/8!/4/2:10)",
          percentage: "0.75",
        },
      });

      expect((await application.getBook({ id: "book-1" }))?.libraryStatus).toBe("archived");
      expect((await application.getBook({ id: "book-1" }))?.readingStatus).toBe("unread");
    });

    it("should return null when saving progress for a missing book", async () => {
      const persistence = createPersistenceInMemory();

      await persistence.users.create({
        record: {
          id: "user-1",
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
          role: "admin",
          createdAt: "2026-03-22T00:00:00.000Z",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(
        await application.saveReadingProgress({
          progress: {
            bookId: "missing-book-id",
            userId: "user-1",
            format: "epub",
            locator: "",
            percentage: "0.10",
          },
        }),
      ).toBeNull();
    });

    it("should return null when saving progress for a missing user", async () => {
      const persistence = createPersistenceInMemory();

      await persistence.books.create({
        record: {
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
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(
        await application.saveReadingProgress({
          progress: {
            bookId: "book-1",
            userId: "missing-user-id",
            format: "epub",
            locator: "",
            percentage: "0.10",
          },
        }),
      ).toBeNull();
    });

    it("should save reading progress for the current authenticated user", async () => {
      const clock = {
        now: () => new Date("2026-03-22T12:00:00.000Z"),
        checkHealth: () => createHealthSuccessResult(),
      };
      const persistence = createPersistenceInMemory();

      await persistence.books.create({
        record: {
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
        },
      });
      const application = createApplication({
        clock,
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      const readingProgress = await application.saveCurrentUserReadingProgress({
        currentUser: {
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
        },
        progress: {
          bookId: "book-1",
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        },
      });

      const savedUser = await persistence.users.getByAuthIdentity({
        authIssuer: "https://id.example.com",
        authSubject: "reader-123",
      });

      expect(savedUser).toEqual({
        id: savedUser?.id,
        authIssuer: "https://id.example.com",
        authSubject: "reader-123",
        email: "reader@example.com",
        emailVerified: true,
        displayName: "Reader",
        avatarUrl: "https://id.example.com/avatar/reader-123",
        role: "member",
        createdAt: "2026-03-22T12:00:00.000Z",
        updatedAt: "2026-03-22T12:00:00.000Z",
      });
      expect(readingProgress).toEqual({
        id: readingProgress?.id,
        bookId: "book-1",
        userId: savedUser?.id,
        format: "epub",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
        createdAt: "2026-03-22T12:00:00.000Z",
        updatedAt: "2026-03-22T12:00:00.000Z",
      });
      expect(
        await application.getCurrentUserReadingProgress({
          currentUser: {
            authIssuer: "https://id.example.com",
            authSubject: "reader-123",
            email: "reader@example.com",
            emailVerified: true,
            displayName: "Reader",
            avatarUrl: "https://id.example.com/avatar/reader-123",
          },
          bookId: "book-1",
        }),
      ).toEqual(readingProgress);
    });

    it("should refresh stored current-user details when saving reading progress", async () => {
      const clock = {
        now: () => new Date("2026-03-22T12:30:00.000Z"),
        checkHealth: () => createHealthSuccessResult(),
      };
      const persistence = createPersistenceInMemory();

      await persistence.books.create({
        record: {
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
        },
      });
      await persistence.users.create({
        record: {
          id: "user-1",
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "old@example.com",
          emailVerified: false,
          displayName: "Old Name",
          avatarUrl: "",
          role: "admin",
          createdAt: "2026-03-22T00:00:00.000Z",
          updatedAt: "2026-03-22T00:00:00.000Z",
        },
      });
      const application = createApplication({
        clock,
        config,
        persistence,
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      await application.saveCurrentUserReadingProgress({
        currentUser: {
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
          email: "reader@example.com",
          emailVerified: true,
          displayName: "Reader",
          avatarUrl: "https://id.example.com/avatar/reader-123",
        },
        progress: {
          bookId: "book-1",
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        },
      });

      expect(
        await persistence.users.getByAuthIdentity({
          authIssuer: "https://id.example.com",
          authSubject: "reader-123",
        }),
      ).toEqual({
        id: "user-1",
        authIssuer: "https://id.example.com",
        authSubject: "reader-123",
        email: "reader@example.com",
        emailVerified: true,
        displayName: "Reader",
        avatarUrl: "https://id.example.com/avatar/reader-123",
        role: "admin",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T12:30:00.000Z",
      });
    });
  });

  describe("book file access functions", () => {
    it("should return book file access details for a stored book file", () => {
      const fileStorage = createTestFileStorage();
      const fileContents = new Uint8Array([1, 2, 3, 4]);

      fileStorage.saveFile({
        file: {
          path: "/tmp/litlocker/library/left-hand.epub",
          name: "left-hand.epub",
          mimeType: "application/epub+zip",
          contents: fileContents,
        },
      });
      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage,
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const book = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
          filePath: "/tmp/litlocker/library/left-hand.epub",
        },
      });

      expect(
        application.getBookFileAccess({
          id: book.id,
        }),
      ).toEqual({
        bookId: book.id,
        fileName: "left-hand.epub",
        format: "epub",
        mimeType: "application/epub+zip",
        contents: fileContents,
      });
    });

    it("should return null when a book cannot be found for file access", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage: createTestFileStorage(),
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });

      expect(
        application.getBookFileAccess({
          id: "missing-book-id",
        }),
      ).toBeNull();
    });

    it("should return null when the stored book file does not exist", () => {
      const application = createApplication({
        clock: createClockSystem(),
        config,
        fileStorage: createTestFileStorage(),
        persistence: createPersistenceInMemory(),
        idGenerator: createIdGeneratorSystem(),
        logger,
      });
      const book = createBookSync(application, {
        book: {
          title: "The Left Hand of Darkness",
          filePath: "/tmp/litlocker/library/missing-book.epub",
        },
      });

      expect(
        application.getBookFileAccess({
          id: book.id,
        }),
      ).toBeNull();
    });
  });
});
