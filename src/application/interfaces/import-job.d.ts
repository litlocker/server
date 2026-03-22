import {
  ImportJob,
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
}

type CreateImportJob = ({ job }: { job: CreateImportJobInput }) => ImportJob;
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
  ImportJobErrorDetails,
  CreateImportJobInput,
  CreateImportJob,
  FinalizeImportJob,
  UpdateImportJob,
  ListImportJobs,
  GetImportJob,
};
