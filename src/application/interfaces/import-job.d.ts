type ImportJobStatus = "queued" | "processing" | "review" | "completed" | "failed";

interface MetadataCandidate {
  title: string;
  authors: string[];
  source: string;
  confidence: string;
}

interface ImportJob {
  id: string;
  sourcePath: string;
  fileType: string;
  status: ImportJobStatus;
  metadataCandidates: MetadataCandidate[];
  errorMessage: string;
}

interface CreateImportJobInput {
  sourcePath: string;
  fileType?: string;
}

type CreateImportJob = ({ job }: { job: CreateImportJobInput }) => ImportJob;
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
  ImportJobStatus,
  MetadataCandidate,
  ImportJob,
  CreateImportJobInput,
  CreateImportJob,
  UpdateImportJob,
  ListImportJobs,
  GetImportJob,
};
