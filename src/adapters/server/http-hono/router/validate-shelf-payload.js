import Ajv from "ajv";

const ajv = new Ajv.default();

const createShelfPayloadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
  },
};

const updateShelfPayloadSchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
  },
};

const validateCreateShelfPayloadBase = ajv.compile(createShelfPayloadSchema);
const validateUpdateShelfPayloadBase = ajv.compile(updateShelfPayloadSchema);

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
const validateCreateShelfPayload = (payload) => {
  const success = validateCreateShelfPayloadBase(payload);

  if (!success) {
    return {
      success: false,
      errors: formatErrors(validateCreateShelfPayloadBase.errors),
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
const validateUpdateShelfPayload = (payload) => {
  const success = validateUpdateShelfPayloadBase(payload);

  if (!success) {
    return {
      success: false,
      errors: formatErrors(validateUpdateShelfPayloadBase.errors),
    };
  }

  return {
    success: true,
    errors: [],
  };
};

export { validateCreateShelfPayload, validateUpdateShelfPayload };
