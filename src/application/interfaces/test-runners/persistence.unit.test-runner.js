/**
 * @import { CreatePersistence } from "../persistence.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreatePersistence } createPersistence */
const runPersistenceUnitTests = (createPersistence) => {
  describe("persistence", () => {
    describe("interface", () => {
      it("should have all persistence groups", () => {
        const persistence = createPersistence();

        expect(persistence).toHaveProperty("books");
        expect(persistence).toHaveProperty("shelves");
        expect(persistence).toHaveProperty("users");
        expect(persistence).toHaveProperty("importJobs");
        expect(persistence).toHaveProperty("readingProgress");
        expect(persistence).toHaveProperty("checkHealth");
      });

      it("should expose the expected functions on each group", () => {
        const persistence = createPersistence();

        expect(persistence.books).toHaveProperty("create");
        expect(persistence.books).toHaveProperty("update");
        expect(persistence.books).toHaveProperty("list");
        expect(persistence.books).toHaveProperty("get");
        expect(persistence.books).toHaveProperty("checkHealth");

        expect(persistence.shelves).toHaveProperty("create");
        expect(persistence.shelves).toHaveProperty("update");
        expect(persistence.shelves).toHaveProperty("list");
        expect(persistence.shelves).toHaveProperty("get");
        expect(persistence.shelves).toHaveProperty("delete");
        expect(persistence.shelves).toHaveProperty("checkHealth");

        expect(persistence.users).toHaveProperty("create");
        expect(persistence.users).toHaveProperty("update");
        expect(persistence.users).toHaveProperty("list");
        expect(persistence.users).toHaveProperty("get");
        expect(persistence.users).toHaveProperty("checkHealth");

        expect(persistence.importJobs).toHaveProperty("create");
        expect(persistence.importJobs).toHaveProperty("update");
        expect(persistence.importJobs).toHaveProperty("list");
        expect(persistence.importJobs).toHaveProperty("get");
        expect(persistence.importJobs).toHaveProperty("checkHealth");

        expect(persistence.readingProgress).toHaveProperty("save");
        expect(persistence.readingProgress).toHaveProperty("get");
        expect(persistence.readingProgress).toHaveProperty("checkHealth");
      });
    });

    describe("functions", () => {
      it("should create and fetch records across each persistence group", () => {
        const persistence = createPersistence();

        const book = persistence.books.create({
          record: {
            id: "book-1",
            title: "Test Book",
            subtitle: "",
            description: "",
            language: "en",
            authors: ["Test Author"],
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
        });
        const shelf = persistence.shelves.create({
          record: {
            id: "shelf-1",
            name: "Favorites",
            description: "",
            bookIds: [book.id],
          },
        });
        const user = persistence.users.create({
          record: {
            id: "user-1",
            email: "reader@example.com",
            displayName: "Reader",
            role: "admin",
          },
        });
        const importJob = persistence.importJobs.create({
          record: {
            id: "import-job-1",
            sourcePath: "/library/inbox/test-book.epub",
            fileType: "epub",
            status: "queued",
            metadataCandidates: [],
            errorMessage: "",
          },
        });
        const readingProgress = persistence.readingProgress.save({
          record: {
            id: "progress-1",
            bookId: book.id,
            userId: user.id,
            locator: "epubcfi(/6/2[cover]!/4/1:0)",
            percentage: "0.25",
          },
        });

        expect(persistence.books.get({ id: book.id })).toEqual(book);
        expect(persistence.shelves.get({ id: shelf.id })).toEqual(shelf);
        expect(persistence.users.get({ id: user.id })).toEqual(user);
        expect(persistence.importJobs.get({ id: importJob.id })).toEqual(importJob);
        expect(
          persistence.readingProgress.get({
            bookId: book.id,
            userId: user.id,
          }),
        ).toEqual(readingProgress);
      });

      it("should expose health status", () => {
        const persistence = createPersistence();

        expect(persistence.checkHealth()).toHaveProperty("success");
        expect(persistence.books.checkHealth()).toHaveProperty("success");
        expect(persistence.shelves.checkHealth()).toHaveProperty("success");
        expect(persistence.users.checkHealth()).toHaveProperty("success");
        expect(persistence.importJobs.checkHealth()).toHaveProperty("success");
        expect(persistence.readingProgress.checkHealth()).toHaveProperty("success");
      });
    });
  });
};

export { runPersistenceUnitTests };
