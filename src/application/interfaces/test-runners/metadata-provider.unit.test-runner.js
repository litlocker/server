/**
 * @import { CreateMetadataProvider } from "../metadata-provider.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreateMetadataProvider } createMetadataProvider */
const runMetadataProviderUnitTests = (createMetadataProvider) => {
  describe("metadata provider", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const metadataProvider = createMetadataProvider();

        expect(metadataProvider).toHaveProperty("extractMetadata");
        expect(metadataProvider).toHaveProperty("lookupMetadata");
        expect(metadataProvider).toHaveProperty("checkHealth");
      });
    });

    describe("functions", () => {
      it("should extract metadata from a file", () => {
        const metadataProvider = createMetadataProvider();

        const metadata = metadataProvider.extractMetadata({
          input: {
            filePath: "/library/inbox/test-book.epub",
            fileType: "epub",
          },
        });

        expect(metadata).toEqual({
          title: "Test Book",
          subtitle: "",
          description: "",
          language: "en",
          authors: ["Test Author"],
          tags: [],
          seriesName: "",
          seriesNumber: "",
          identifiers: {
            isbn10: "",
            isbn13: "",
            asin: "",
            goodreadsId: "",
            googleBooksId: "",
          },
          coverPath: "",
          source: "embedded",
        });
      });

      it("should return metadata candidates from external lookup", () => {
        const metadataProvider = createMetadataProvider();

        const results = metadataProvider.lookupMetadata({
          input: {
            title: "Test Book",
            authors: ["Test Author"],
          },
        });

        expect(results).toEqual([
          {
            title: "Test Book",
            subtitle: "",
            description: "",
            language: "en",
            authors: ["Test Author"],
            tags: [],
            seriesName: "",
            seriesNumber: "",
            identifiers: {
              isbn10: "",
              isbn13: "",
              asin: "",
              goodreadsId: "",
              googleBooksId: "",
            },
            coverPath: "",
            source: "external",
          },
        ]);
      });

      it("should expose health status", () => {
        const metadataProvider = createMetadataProvider();

        const result = metadataProvider.checkHealth();

        expect(result).toHaveProperty("success");
      });
    });
  });
};

export { runMetadataProviderUnitTests };
