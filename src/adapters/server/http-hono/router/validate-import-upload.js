const GENERIC_UPLOAD_MIME_TYPES = new Set(["", "application/octet-stream"]);

/** @type {Record<string, Set<string>>} */
const MIME_TYPES_BY_EXTENSION = {
  epub: new Set(["application/epub+zip"]),
  pdf: new Set(["application/pdf"]),
  cbz: new Set(["application/vnd.comicbook+zip", "application/x-cbz", "application/zip"]),
  cbr: new Set([
    "application/vnd.comicbook-rar",
    "application/x-cbr",
    "application/vnd.rar",
    "application/x-rar-compressed",
  ]),
};

/**
 * @param {string} fileName
 * @returns {string}
 */
const getLowercaseFileExtension = (fileName) => {
  const trimmedFileName = fileName.trim();
  const lastDotIndex = trimmedFileName.lastIndexOf(".");

  if (lastDotIndex < 0 || lastDotIndex === trimmedFileName.length - 1) {
    return "";
  }

  return trimmedFileName.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * @param {object} params
 * @param {File} params.file
 * @param {import("../../../../application/interfaces/config.js").ImportsConfig} params.importsConfig
 * @returns {{ success: true, fileExtension: string } | { success: false, status: 400 | 413, code: string, message: string, details: Record<string, unknown> }}
 */
const validateImportUpload = ({ file, importsConfig }) => {
  if (file.size > importsConfig.maxFileSizeInBytes) {
    return {
      success: false,
      status: 413,
      code: "import_file_too_large",
      message: "Import file exceeds the configured size limit",
      details: {
        fileName: file.name,
        fileSizeInBytes: file.size,
        maxFileSizeInBytes: importsConfig.maxFileSizeInBytes,
      },
    };
  }

  const fileExtension = getLowercaseFileExtension(file.name);

  if (!importsConfig.allowedFileExtensions.includes(fileExtension)) {
    return {
      success: false,
      status: 400,
      code: "unsupported_import_file_extension",
      message: "Import file extension is not allowed",
      details: {
        fileName: file.name,
        fileExtension,
        allowedFileExtensions: importsConfig.allowedFileExtensions,
      },
    };
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[fileExtension] ?? new Set();

  if (
    !GENERIC_UPLOAD_MIME_TYPES.has(normalizedMimeType) &&
    !allowedMimeTypes.has(normalizedMimeType)
  ) {
    return {
      success: false,
      status: 400,
      code: "unsupported_import_mime_type",
      message: "Import file MIME type is not allowed",
      details: {
        fileName: file.name,
        fileExtension,
        mimeType: file.type,
      },
    };
  }

  return {
    success: true,
    fileExtension,
  };
};

export { validateImportUpload };
