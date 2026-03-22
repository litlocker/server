/**
 * @import { Config } from "../../../application/interfaces/config.js";
 * @import { FileStorage, FileStorageEntry } from "../../../application/interfaces/file-storage.js";
 * @import { Logger } from "../../../application/interfaces/logger.js";
 * @import { FailureResult, SuccessResult, HealthStatus } from "../../../application/interfaces/result.js";
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve, sep } from "node:path";

/**
 * @param {Record<string, unknown>} details
 * @returns {SuccessResult<HealthStatus>}
 */
const createHealthSuccessResult = (details) => {
  return {
    success: true,
    data: {
      status: "ok",
      details,
    },
  };
};

/**
 * @param {Record<string, unknown>} error
 * @returns {FailureResult}
 */
const createHealthFailureResult = (error) => {
  return {
    success: false,
    error: {
      code: "file_storage_unavailable",
      message: "File storage is unavailable",
      details: error,
    },
  };
};

/**
 * @param {object} params
 * @param {string} params.path
 * @param {string} params.root
 * @returns {boolean}
 */
const isPathInsideRoot = ({ path, root }) => {
  return path === root || path.startsWith(`${root}${sep}`);
};

/**
 * @param {Pick<Config, "storage">} config
 * @returns {string[]}
 */
const createAllowedRoots = (config) => {
  return [
    resolve(config.storage.paths.library),
    resolve(config.storage.paths.imports),
    resolve(config.storage.paths.covers),
  ];
};

/**
 * @param {object} params
 * @param {string} params.path
 * @param {string} params.name
 * @param {string} params.mimeType
 * @param {number} params.sizeInBytes
 * @returns {FileStorageEntry}
 */
const createMetadataEntry = ({ path, name, mimeType, sizeInBytes }) => {
  return {
    path,
    name,
    mimeType,
    sizeInBytes,
  };
};

/**
 * @param { object } params
 * @param { string } params.path
 * @param { string[] } params.allowedRoots
 * @returns { string }
 */
const resolveAllowedPath = ({ path, allowedRoots }) => {
  const resolvedPath = resolve(path);
  const isAllowed = allowedRoots.some((root) => isPathInsideRoot({ path: resolvedPath, root }));

  if (!isAllowed) {
    throw new Error("File path must be inside the configured storage paths");
  }

  return resolvedPath;
};

/**
 * @param { object } params
 * @param { string } params.path
 * @param { string[] } params.allowedRoots
 */
const ensureParentDirectory = ({ path, allowedRoots }) => {
  const resolvedPath = resolveAllowedPath({ path, allowedRoots });

  mkdirSync(dirname(resolvedPath), { recursive: true });
};

/**
 * @param { object } params
 * @param { Pick<Config, "storage"> } params.config
 * @param { Logger } [params.logger]
 * @returns { FileStorage }
 */
const createFileStorageLocalFilesystem = ({ config, logger }) => {
  const allowedRoots = createAllowedRoots(config);
  const metadata = new Map();

  return {
    saveFile: ({ file }) => {
      const resolvedPath = resolveAllowedPath({
        path: file.path,
        allowedRoots,
      });

      ensureParentDirectory({
        path: resolvedPath,
        allowedRoots,
      });

      writeFileSync(resolvedPath, Buffer.from(file.contents));

      const entry = createMetadataEntry({
        path: resolvedPath,
        name: file.name ?? basename(resolvedPath),
        mimeType: file.mimeType ?? "",
        sizeInBytes: statSync(resolvedPath).size,
      });

      metadata.set(resolvedPath, entry);
      logger?.info("File saved to local storage", {
        domain: "file_storage",
        operation: "save",
        path: resolvedPath,
        mimeType: entry.mimeType,
        sizeInBytes: entry.sizeInBytes,
      });

      return entry;
    },
    readFile: ({ file }) => {
      const resolvedPath = resolveAllowedPath({
        path: file.path,
        allowedRoots,
      });
      logger?.info("File read from local storage", {
        domain: "file_storage",
        operation: "read",
        path: resolvedPath,
      });

      return new Uint8Array(readFileSync(resolvedPath));
    },
    deleteFile: ({ file }) => {
      const resolvedPath = resolveAllowedPath({
        path: file.path,
        allowedRoots,
      });

      if (!existsSync(resolvedPath)) {
        logger?.warn("Attempted to delete a missing file", {
          domain: "file_storage",
          operation: "delete",
          path: resolvedPath,
        });
        return {
          success: false,
        };
      }

      rmSync(resolvedPath);
      metadata.delete(resolvedPath);
      logger?.info("File deleted from local storage", {
        domain: "file_storage",
        operation: "delete",
        path: resolvedPath,
      });

      return {
        success: true,
      };
    },
    moveFile: ({ file }) => {
      const fromPath = resolveAllowedPath({
        path: file.fromPath,
        allowedRoots,
      });
      const toPath = resolveAllowedPath({
        path: file.toPath,
        allowedRoots,
      });

      ensureParentDirectory({
        path: toPath,
        allowedRoots,
      });

      renameSync(fromPath, toPath);

      const currentMetadata = metadata.get(fromPath);
      const nextMetadata = createMetadataEntry({
        path: toPath,
        name: currentMetadata?.name ?? basename(toPath),
        mimeType: currentMetadata?.mimeType ?? "",
        sizeInBytes: statSync(toPath).size,
      });

      metadata.delete(fromPath);
      metadata.set(toPath, nextMetadata);
      logger?.info("File moved within local storage", {
        domain: "file_storage",
        operation: "move",
        fromPath,
        toPath,
        sizeInBytes: nextMetadata.sizeInBytes,
      });

      return nextMetadata;
    },
    fileExists: ({ file }) => {
      const resolvedPath = resolveAllowedPath({
        path: file.path,
        allowedRoots,
      });

      return existsSync(resolvedPath);
    },
    checkHealth: () => {
      try {
        allowedRoots.forEach((root) => {
          mkdirSync(root, { recursive: true });
        });

        return createHealthSuccessResult({
          roots: allowedRoots,
        });
      } catch (error) {
        return createHealthFailureResult({
          message: error instanceof Error ? error.message : "Unknown file storage error",
        });
      }
    },
  };
};

export { createFileStorageLocalFilesystem };
