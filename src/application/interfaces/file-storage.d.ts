import { Logger } from "./logger.d.ts";
import { CheckHealth } from "./result.d.ts";

interface FileStorageEntry {
  path: string;
  name: string;
  mimeType: string;
  sizeInBytes: number;
}

interface SaveFileInput {
  path: string;
  name?: string;
  mimeType?: string;
  contents: Uint8Array;
}

interface ReadFileInput {
  path: string;
}

interface DeleteFileInput {
  path: string;
}

interface MoveFileInput {
  fromPath: string;
  toPath: string;
}

interface FileExistsInput {
  path: string;
}

type SaveFile = ({ file }: { file: SaveFileInput }) => FileStorageEntry;
type ReadFile = ({ file }: { file: ReadFileInput }) => Uint8Array;
type DeleteFile = ({ file }: { file: DeleteFileInput }) => { success: boolean };
type MoveFile = ({ file }: { file: MoveFileInput }) => FileStorageEntry;
type FileExists = ({ file }: { file: FileExistsInput }) => boolean;

interface FileStorage {
  saveFile: SaveFile;
  readFile: ReadFile;
  deleteFile: DeleteFile;
  moveFile: MoveFile;
  fileExists: FileExists;
  checkHealth: CheckHealth;
}

interface Deps {
  logger?: Logger;
}

type CreateFileStorage = (deps?: Deps) => FileStorage;

export type { FileStorageEntry, FileStorage, CreateFileStorage };
