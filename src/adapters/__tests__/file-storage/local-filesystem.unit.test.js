import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
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
});
