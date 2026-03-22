import { describe, expect, it, vi } from "vitest";
import { runMetadataProviderUnitTests } from "../../../application/interfaces/test-runners/metadata-provider.unit.test-runner.js";
import { createMetadataProviderStatic } from "../../metadata-provider/static/index.js";

runMetadataProviderUnitTests(createMetadataProviderStatic);

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

describe("static metadata provider", () => {
  it("should emit structured logs for embedded extraction and lookup", () => {
    const logger = createLoggerMock();
    const metadataProvider = createMetadataProviderStatic({ logger });

    metadataProvider.extractMetadata({
      input: {
        filePath: "/tmp/uploads/book.epub",
        fileType: "epub",
      },
    });
    metadataProvider.lookupMetadata({
      input: {
        title: "Test Book",
        authors: ["Test Author"],
      },
    });

    expect(logger.info).toHaveBeenCalledWith("Embedded metadata extracted", {
      domain: "metadata",
      operation: "extract_embedded",
      filePath: "/tmp/uploads/book.epub",
      fileType: "epub",
      provider: "static",
    });
    expect(logger.info).toHaveBeenCalledWith("External metadata lookup completed", {
      domain: "metadata",
      operation: "lookup_external",
      title: "Test Book",
      authorCount: 1,
      provider: "static",
      resultCount: 1,
    });
  });
});
