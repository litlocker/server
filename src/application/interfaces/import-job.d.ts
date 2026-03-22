import {
  ImportJob,
  ImportJobDuplicateDetection,
  ImportJobErrorDetails,
  ImportJobMetadataCandidate,
  ImportJobSource,
  ImportJobSourceKind,
  ImportJobStatus,
} from "../entities/import-job.d.ts";

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

type CreateImportJob = ({ job }: { job: CreateImportJobInput }) => ImportJob;
type IngestImportUpload = ({ upload }: { upload: IngestImportUploadInput }) => ImportJob;
type FinalizeImportJob = ({ id }: { id: string }) => ImportJob | null;
type UpdateImportJob = ({
  id,
  updates,
}: {
  id: string;
  updates: Partial<ImportJob>;
}) => ImportJob | null;
type ListImportJobs = () => ImportJob[];
type GetImportJob = ({ id }: { id: string }) => ImportJob | null;

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
  CreateImportJob,
  IngestImportUpload,
  FinalizeImportJob,
  UpdateImportJob,
  ListImportJobs,
  GetImportJob,
};
