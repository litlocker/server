import { describe, expect, it } from "vitest";
import { validateImportUpload } from "../../server/http-hono/router/validate-import-upload.js";

describe("http hono import upload validation", () => {
  const importsConfig = {
    maxFileSizeInBytes: 10,
    allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
    duplicateCheckEnabled: true,
    uploadRateLimit: {
      windowMs: 60_000,
      maxRequests: 10,
    },
  };

  it("should accept an allowed extension with a matching mime type", () => {
    const result = validateImportUpload({
      file: new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/epub+zip",
      }),
      importsConfig,
    });

    expect(result).toEqual({
      success: true,
      fileExtension: "epub",
    });
  });

  it("should reject files that exceed the configured size limit", () => {
    const result = validateImportUpload({
      file: new File([new Uint8Array(11)], "left-hand.epub", {
        type: "application/epub+zip",
      }),
      importsConfig,
    });

    expect(result).toEqual({
      success: false,
      status: 413,
      code: "import_file_too_large",
      message: "Import file exceeds the configured size limit",
      details: {
        fileName: "left-hand.epub",
        fileSizeInBytes: 11,
        maxFileSizeInBytes: 10,
      },
    });
  });

  it("should reject files with a disallowed extension", () => {
    const result = validateImportUpload({
      file: new File([new Uint8Array([1, 2, 3])], "notes.txt", {
        type: "text/plain",
      }),
      importsConfig,
    });

    expect(result).toEqual({
      success: false,
      status: 400,
      code: "unsupported_import_file_extension",
      message: "Import file extension is not allowed",
      details: {
        fileName: "notes.txt",
        fileExtension: "txt",
        allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
      },
    });
  });

  it("should reject files with a mismatched mime type", () => {
    const result = validateImportUpload({
      file: new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/pdf",
      }),
      importsConfig,
    });

    expect(result).toEqual({
      success: false,
      status: 400,
      code: "unsupported_import_mime_type",
      message: "Import file MIME type is not allowed",
      details: {
        fileName: "left-hand.epub",
        fileExtension: "epub",
        mimeType: "application/pdf",
      },
    });
  });

  it("should allow generic browser upload mime types when the extension is allowed", () => {
    const result = validateImportUpload({
      file: new File([new Uint8Array([1, 2, 3])], "left-hand.epub", {
        type: "application/octet-stream",
      }),
      importsConfig,
    });

    expect(result).toEqual({
      success: true,
      fileExtension: "epub",
    });
  });
});
