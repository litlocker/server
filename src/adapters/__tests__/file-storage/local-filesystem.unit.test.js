import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { runFileStorageUnitTests } from "../../../application/interfaces/test-runners/file-storage.unit.test-runner.js";
import { createFileStorageLocalFilesystem } from "../../file-storage/local-filesystem/index.js";

const testRootPath = mkdtempSync(join(tmpdir(), "litlocker-file-storage-"));
const config = {
  storage: {
    paths: {
      library: join(testRootPath, "library"),
      imports: join(testRootPath, "imports"),
      covers: join(testRootPath, "covers"),
    },
  },
};

afterAll(() => {
  rmSync(testRootPath, { recursive: true, force: true });
});

/**
 * @returns {import("../../../application/interfaces/logger.js").Logger}
 */
const createLoggerMock = () => {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

runFileStorageUnitTests(() => createFileStorageLocalFilesystem({ config }), {
  paths: {
    inbox: join(config.storage.paths.imports, "test-book.epub"),
    books: join(config.storage.paths.library, "test-book.epub"),
  },
});

describe("local filesystem file storage", () => {
  it("should reject paths outside the configured storage roots", () => {
    const fileStorage = createFileStorageLocalFilesystem({ config });

    expect(() =>
      fileStorage.saveFile({
        file: {
          path: join(testRootPath, "..", "outside.epub"),
          contents: new Uint8Array([1]),
        },
      }),
    ).toThrow("File path must be inside the configured storage paths");
  });

  it("should expose configured roots in the health details", () => {
    const fileStorage = createFileStorageLocalFilesystem({ config });

    expect(fileStorage.checkHealth()).toEqual({
      success: true,
      data: {
        status: "ok",
        details: {
          roots: [
            config.storage.paths.library,
            config.storage.paths.imports,
            config.storage.paths.covers,
          ],
        },
      },
    });
  });

  it("should emit structured logs for file operations", () => {
    const logger = createLoggerMock();
    const fileStorage = createFileStorageLocalFilesystem({ config, logger });
    const importPath = join(config.storage.paths.imports, "logged.epub");
    const libraryPath = join(config.storage.paths.library, "logged.epub");

    fileStorage.saveFile({
      file: {
        path: importPath,
        name: "logged.epub",
        mimeType: "application/epub+zip",
        contents: new Uint8Array([1, 2, 3]),
      },
    });
    fileStorage.readFile({
      file: {
        path: importPath,
      },
    });
    fileStorage.moveFile({
      file: {
        fromPath: importPath,
        toPath: libraryPath,
      },
    });
    fileStorage.deleteFile({
      file: {
        path: libraryPath,
      },
    });

    expect(logger.info).toHaveBeenCalledWith("File saved to local storage", {
      domain: "file_storage",
      operation: "save",
      path: importPath,
      mimeType: "application/epub+zip",
      sizeInBytes: 3,
    });
    expect(logger.info).toHaveBeenCalledWith("File read from local storage", {
      domain: "file_storage",
      operation: "read",
      path: importPath,
    });
    expect(logger.info).toHaveBeenCalledWith("File moved within local storage", {
      domain: "file_storage",
      operation: "move",
      fromPath: importPath,
      toPath: libraryPath,
      sizeInBytes: 3,
    });
    expect(logger.info).toHaveBeenCalledWith("File deleted from local storage", {
      domain: "file_storage",
      operation: "delete",
      path: libraryPath,
    });
  });
});
