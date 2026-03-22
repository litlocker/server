/**
 * @import { Config } from "../../../../application/interfaces/config.js";
 * @import { FileStorage } from "../../../../application/interfaces/file-storage.js";
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

const createHealthSuccessResult = (details) => {
  return {
    success: true,
    data: {
      status: "ok",
      details,
    },
  };
};

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

const isPathInsideRoot = ({ path, root }) => {
  return path === root || path.startsWith(`${root}${sep}`);
};

const createAllowedRoots = (config) => {
  return [
    resolve(config.storage.paths.library),
    resolve(config.storage.paths.imports),
    resolve(config.storage.paths.covers),
  ];
};

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
 * @param { Config } params.config
 * @returns { FileStorage }
 */
const createFileStorageLocalFilesystem = ({ config }) => {
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

      return entry;
    },
    readFile: ({ file }) => {
      const resolvedPath = resolveAllowedPath({
        path: file.path,
        allowedRoots,
      });

      return new Uint8Array(readFileSync(resolvedPath));
    },
    deleteFile: ({ file }) => {
      const resolvedPath = resolveAllowedPath({
        path: file.path,
        allowedRoots,
      });

      if (!existsSync(resolvedPath)) {
        return {
          success: false,
        };
      }

      rmSync(resolvedPath);
      metadata.delete(resolvedPath);

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
