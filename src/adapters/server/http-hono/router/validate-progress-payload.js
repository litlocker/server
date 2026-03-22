import Ajv from "ajv";

const ajv = new Ajv.default();

const createProgressPayloadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["bookId", "userId", "format", "locator", "percentage"],
  properties: {
    bookId: { type: "string", minLength: 1 },
    userId: { type: "string", minLength: 1 },
    format: {
      type: "string",
      enum: ["epub", "pdf", "comic"],
    },
    locator: { type: "string", minLength: 1 },
    percentage: {
      type: "string",
      pattern: "^(0(\\.\\d+)?|1(\\.0+)?)$",
    },
  },
};

const validateCreateProgressPayloadBase = ajv.compile(createProgressPayloadSchema);

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
 * @param {{ format: string, locator: string }} payload
 */
const validateLocatorByFormat = ({ format, locator }) => {
  if (format === "epub" && !/^epubcfi\(.*\)$/.test(locator)) {
    return {
      success: false,
      errors: ["/locator must be a valid EPUB CFI"],
    };
  }

  if (format === "pdf" && !/^page=\d+$/.test(locator)) {
    return {
      success: false,
      errors: ["/locator must be a valid PDF page locator"],
    };
  }

  if (format === "comic" && !/^image=\d+$/.test(locator)) {
    return {
      success: false,
      errors: ["/locator must be a valid comic image locator"],
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
const validateCreateProgressPayload = (payload) => {
  const success = validateCreateProgressPayloadBase(payload);

  if (!success) {
    return {
      success: false,
      errors: formatErrors(validateCreateProgressPayloadBase.errors),
    };
  }

  return validateLocatorByFormat(/** @type {{ format: string, locator: string }} */ (payload));
};

export { validateCreateProgressPayload };
