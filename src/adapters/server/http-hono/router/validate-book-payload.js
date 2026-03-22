import Ajv from "ajv";

const ajv = new Ajv.default();

const bookLibraryStatusSchema = {
  type: "string",
  enum: ["draft", "ready", "archived"],
};

const bookReadingStatusSchema = {
  type: "string",
  enum: ["unread", "started", "finished"],
};

const bookIdentifiersSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isbn10: { type: "string" },
    isbn13: { type: "string" },
    asin: { type: "string" },
    goodreadsId: { type: "string" },
    googleBooksId: { type: "string" },
  },
};

const bookCoverSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sourcePath: { type: "string" },
    thumbnailPath: { type: "string" },
    mimeType: { type: "string" },
    dominantColor: { type: "string" },
  },
};

const createBookPayloadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title"],
  properties: {
    title: { type: "string", minLength: 1 },
    subtitle: { type: "string" },
    description: { type: "string" },
    language: { type: "string" },
    authors: {
      type: "array",
      items: { type: "string" },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    seriesName: { type: "string" },
    seriesNumber: { type: "string" },
    filePath: { type: "string" },
    cover: bookCoverSchema,
    identifiers: bookIdentifiersSchema,
    libraryStatus: bookLibraryStatusSchema,
    readingStatus: bookReadingStatusSchema,
  },
};

const updateBookPayloadSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: { type: "string", minLength: 1 },
    subtitle: { type: "string" },
    description: { type: "string" },
    language: { type: "string" },
    authors: {
      type: "array",
      items: { type: "string" },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    seriesName: { type: "string" },
    seriesNumber: { type: "string" },
    filePath: { type: "string" },
    cover: bookCoverSchema,
    identifiers: bookIdentifiersSchema,
    libraryStatus: bookLibraryStatusSchema,
    readingStatus: bookReadingStatusSchema,
  },
};

const validateCreateBookPayloadBase = ajv.compile(createBookPayloadSchema);
const validateUpdateBookPayloadBase = ajv.compile(updateBookPayloadSchema);

/**
 * @param { import("ajv").ErrorObject[] | null | undefined } errors
 */
const formatErrors = (errors) => {
  return (
    errors?.map((error) => {
      const location = error.instancePath || "/";
      return `${location} ${error.message}`;
    }) ?? []
  );
};

/**
 * @param { unknown } payload
 */
const validateCreateBookPayload = (payload) => {
  const success = validateCreateBookPayloadBase(payload);

  if (!success) {
    return {
      success: false,
      errors: formatErrors(validateCreateBookPayloadBase.errors),
    };
  }

  return {
    success: true,
    errors: [],
  };
};

/**
 * @param { unknown } payload
 */
const validateUpdateBookPayload = (payload) => {
  const success = validateUpdateBookPayloadBase(payload);

  if (!success) {
    return {
      success: false,
      errors: formatErrors(validateUpdateBookPayloadBase.errors),
    };
  }

  return {
    success: true,
    errors: [],
  };
};

export { validateCreateBookPayload, validateUpdateBookPayload };
