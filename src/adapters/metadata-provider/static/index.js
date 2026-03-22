/**
 * @import { CreateMetadataProvider } from "../../../application/interfaces/metadata-provider.js";
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
const createMetadataProviderStatic = () => {
  return {
    extractMetadata: () => {
      return createMetadataRecord({ source: "embedded" });
    },
    lookupMetadata: () => {
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
