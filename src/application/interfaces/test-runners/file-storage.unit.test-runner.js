/**
 * @import { CreateFileStorage } from "../file-storage.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreateFileStorage } createFileStorage */
const runFileStorageUnitTests = (createFileStorage) => {
  describe("file storage", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const fileStorage = createFileStorage();

        expect(fileStorage).toHaveProperty("saveFile");
        expect(fileStorage).toHaveProperty("readFile");
        expect(fileStorage).toHaveProperty("deleteFile");
        expect(fileStorage).toHaveProperty("moveFile");
        expect(fileStorage).toHaveProperty("fileExists");
      });
    });

    describe("functions", () => {
      it("should save, read, move, and delete files", () => {
        const fileStorage = createFileStorage();
        const contents = new Uint8Array([1, 2, 3]);

        const savedFile = fileStorage.saveFile({
          file: {
            path: "/library/inbox/test-book.epub",
            name: "test-book.epub",
            mimeType: "application/epub+zip",
            contents,
          },
        });

        expect(savedFile).toEqual({
          path: "/library/inbox/test-book.epub",
          name: "test-book.epub",
          mimeType: "application/epub+zip",
          sizeInBytes: 3,
        });
        expect(fileStorage.fileExists({ file: { path: savedFile.path } })).toBe(true);
        expect(fileStorage.readFile({ file: { path: savedFile.path } })).toEqual(contents);

        const movedFile = fileStorage.moveFile({
          file: {
            fromPath: savedFile.path,
            toPath: "/library/books/test-book.epub",
          },
        });

        expect(movedFile.path).toBe("/library/books/test-book.epub");
        expect(fileStorage.fileExists({ file: { path: savedFile.path } })).toBe(false);
        expect(fileStorage.fileExists({ file: { path: movedFile.path } })).toBe(true);

        expect(fileStorage.deleteFile({ file: { path: movedFile.path } })).toEqual({
          success: true,
        });
        expect(fileStorage.fileExists({ file: { path: movedFile.path } })).toBe(false);
      });
    });
  });
};

export { runFileStorageUnitTests };
