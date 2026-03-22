/**
 * @import { CreateMetadataProvider } from "../../../application/interfaces/metadata-provider.js";
 */

/**
 * @param {object} params
 * @param {string} params.source
 */
const createMetadataRecord = ({ source }) => {
  return {
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
    source,
  };
};

/** @type { CreateMetadataProvider } */
const createMetadataProviderStatic = ({ logger } = {}) => {
  return {
    extractMetadata: ({ input }) => {
      logger?.info("Embedded metadata extracted", {
        domain: "metadata",
        operation: "extract_embedded",
        filePath: input.filePath,
        fileType: input.fileType,
        provider: "static",
      });

      return createMetadataRecord({ source: "embedded" });
    },
    lookupMetadata: ({ input }) => {
      logger?.info("External metadata lookup completed", {
        domain: "metadata",
        operation: "lookup_external",
        title: input.title,
        authorCount: input.authors?.length ?? 0,
        provider: "static",
        resultCount: 1,
      });

      return [createMetadataRecord({ source: "external" })];
    },
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

export { createMetadataProviderStatic };
