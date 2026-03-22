import {
  ImportJob,
  ImportJobDuplicateDetection,
  ImportJobErrorDetails,
  ImportJobMetadataCandidate,
  ImportJobSource,
  ImportJobSourceKind,
  ImportJobStatus,
} from "../entities/import-job.d.ts";
import { Awaitable } from "./result.d.ts";

interface CreateImportJobInput {
  source: {
    kind: ImportJobSourceKind;
    path: string;
    originalFileName?: string;
  };
  detectedFileType?: string;
  metadataCandidates?: ImportJobMetadataCandidate[];
  fileHash?: string;
}

interface IngestImportUploadInput {
  name: string;
  mimeType?: string;
  contents: Uint8Array;
}

interface ReviewImportJobInput {
  id: string;
  metadataCandidateIndex: number;
}

type CreateImportJob = ({ job }: { job: CreateImportJobInput }) => Awaitable<ImportJob>;
type IngestImportUpload = ({ upload }: { upload: IngestImportUploadInput }) => Awaitable<ImportJob>;
type ReviewImportJob = ({
  id,
  metadataCandidateIndex,
}: ReviewImportJobInput) => Awaitable<ImportJob | null>;
type FinalizeImportJob = ({ id }: { id: string }) => Awaitable<ImportJob | null>;
type UpdateImportJob = ({
  id,
  updates,
}: {
  id: string;
  updates: Partial<ImportJob>;
}) => Awaitable<ImportJob | null>;
type ListImportJobs = () => Awaitable<ImportJob[]>;
type GetImportJob = ({ id }: { id: string }) => Awaitable<ImportJob | null>;

export type {
  ImportJob,
  ImportJobStatus,
  ImportJobSourceKind,
  ImportJobSource,
  ImportJobMetadataCandidate,
  ImportJobDuplicateDetection,
  ImportJobErrorDetails,
  CreateImportJobInput,
  IngestImportUploadInput,
  ReviewImportJobInput,
  CreateImportJob,
  IngestImportUpload,
  ReviewImportJob,
  FinalizeImportJob,
  UpdateImportJob,
  ListImportJobs,
  GetImportJob,
};
