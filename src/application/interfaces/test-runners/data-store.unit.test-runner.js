/**
 * @import { CreateDataStore } from "../data-store.js";
 */

import { describe, it, expect } from "vitest";

/** @param { CreateDataStore } createDataStore */
const runDataStoreUnitTests = (createDataStore) => {
  describe("data store", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const dataStore = createDataStore();

        expect(dataStore).toHaveProperty("createBook");
        expect(dataStore).toHaveProperty("updateBook");
        expect(dataStore).toHaveProperty("listBooks");
        expect(dataStore).toHaveProperty("getBook");
      });
    });

    describe("book storage", () => {
      it("should create and list books", () => {
        const dataStore = createDataStore();
        const firstBook = dataStore.createBook({
          book: {
            title: "The Left Hand of Darkness",
          },
        });
        const secondBook = dataStore.createBook({
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
        expect(dataStore.listBooks()).toEqual([firstBook, secondBook]);
      });

      it("should fetch a book by id", () => {
        const dataStore = createDataStore();
        const book = dataStore.createBook({
          book: {
            title: "The Dispossessed",
          },
        });

        expect(dataStore.getBook({ id: book.id })).toEqual(book);
      });

      it("should return null when the book does not exist", () => {
        const dataStore = createDataStore();

        expect(dataStore.getBook({ id: "missing-book-id" })).toBeNull();
      });

      it("should update an existing book", () => {
        const dataStore = createDataStore();
        const book = dataStore.createBook({
          book: {
            title: "The Tombs of Atuan",
            description: "Original description",
          },
        });

        const updatedBook = dataStore.updateBook({
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
        expect(dataStore.getBook({ id: book.id })).toEqual(updatedBook);
      });

      it("should return null when updating a missing book", () => {
        const dataStore = createDataStore();

        expect(
          dataStore.updateBook({
            id: "missing-book-id",
            updates: {
              title: "Tehanu",
            },
          }),
        ).toBeNull();
      });
    });
  });
};

export { runDataStoreUnitTests };
