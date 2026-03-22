/**
 * @param {object} params
 * @param {string} params.code
 * @param {string} params.message
 * @param {Record<string, unknown>} [params.details]
 * @param {string[]} [params.errors]
 * @returns {{ message: string; error: { code: string; message: string; details: Record<string, unknown> }; errors?: string[] }}
 */
const createErrorBody = ({ code, message, details = {}, errors }) => {
  return {
    message,
    error: {
      code,
      message,
      details: {
        ...details,
        ...(errors ? { errors } : {}),
      },
    },
    ...(errors ? { errors } : {}),
  };
};

/**
 * @param {object} params
 * @param {import("hono").Context} params.context
 * @param {import("hono/utils/http-status").ContentfulStatusCode} params.status
 * @param {string} params.code
 * @param {string} params.message
 * @param {Record<string, unknown>} [params.details]
 * @param {string[]} [params.errors]
 * @returns {Response}
 */
const respondWithError = ({ context, status, code, message, details, errors }) => {
  return context.json(createErrorBody({ code, message, details, errors }), { status });
};

/**
 * @param {object} params
 * @param {import("hono").Context} params.context
 * @param {string} params.resource
 * @param {string} params.message
 * @param {Record<string, unknown>} [params.details]
 * @returns {Response}
 */
const respondWithNotFound = ({ context, resource, message, details }) => {
  return respondWithError({
    context,
    status: 404,
    code: `${resource}_not_found`,
    message,
    details,
  });
};

/**
 * @param {object} params
 * @param {import("hono").Context} params.context
 * @param {string} params.resource
 * @param {string} params.message
 * @param {string[]} params.errors
 * @returns {Response}
 */
const respondWithValidationError = ({ context, resource, message, errors }) => {
  return respondWithError({
    context,
    status: 400,
    code: `invalid_${resource}_payload`,
    message,
    details: {
      resource,
    },
    errors,
  });
};

/**
 * @param {object} params
 * @param {import("hono").Context} params.context
 * @param {string} params.code
 * @param {string} params.message
 * @param {Record<string, unknown>} [params.details]
 * @returns {Response}
 */
const respondWithUnauthorized = ({ context, code, message, details }) => {
  return respondWithError({
    context,
    status: 401,
    code,
    message,
    details,
  });
};

/**
 * @param {object} params
 * @param {import("hono").Context} params.context
 * @param {import("../../../../application/interfaces/result.js").FailureResult} params.failure
 * @param {import("hono/utils/http-status").ContentfulStatusCode} [params.status]
 * @returns {Response}
 */
const respondWithApplicationFailure = ({ context, failure, status = 500 }) => {
  return respondWithError({
    context,
    status,
    code: failure.error.code,
    message: failure.error.message,
    details: failure.error.details,
  });
};

/**
 * @param {object} params
 * @param {import("hono").Context} params.context
 * @param {import("../../../../application/interfaces/logger.js").Logger} params.logger
 * @param {unknown} params.error
 * @returns {Response}
 */
const respondWithInternalError = ({ context, logger, error }) => {
  logger.error("Unhandled HTTP adapter error", {
    domain: "http",
    operation: "error_response",
    path: context.req.path,
    method: context.req.method,
    error,
  });

  return respondWithError({
    context,
    status: 500,
    code: "internal_server_error",
    message: "An unexpected error occurred",
    details: {
      path: context.req.path,
      method: context.req.method,
    },
  });
};

export {
  respondWithApplicationFailure,
  respondWithError,
  respondWithInternalError,
  respondWithNotFound,
  respondWithUnauthorized,
  respondWithValidationError,
};
