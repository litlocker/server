import { BookIdentifiers } from "./book.d.ts";

type ImportJobStatus = "queued" | "processing" | "review" | "completed" | "failed";
type ImportJobSourceKind = "upload" | "filesystem";

interface ImportJobSource {
  kind: ImportJobSourceKind;
  path: string;
  originalFileName: string;
}

interface ImportJobMetadataCandidate {
  title: string;
  subtitle: string;
  description: string;
  language: string;
  authors: string[];
  tags: string[];
  seriesName: string;
  seriesNumber: string;
  identifiers: BookIdentifiers;
  coverPath: string;
  source: string;
  confidence: string;
}

interface ImportJobErrorDetails {
  code: string;
  message: string;
  details: string;
}

interface ImportJobDuplicateDetection {
  fileHash: string;
  duplicateImportJobIds: string[];
  duplicateBookIds: string[];
}

interface ImportJob {
  id: string;
  status: ImportJobStatus;
  source: ImportJobSource;
  detectedFileType: string;
  metadataCandidates: ImportJobMetadataCandidate[];
  duplicateDetection: ImportJobDuplicateDetection;
  error: ImportJobErrorDetails;
}

export type {
  ImportJobStatus,
  ImportJobSourceKind,
  ImportJobSource,
  ImportJobMetadataCandidate,
  ImportJobErrorDetails,
  ImportJobDuplicateDetection,
  ImportJob,
};
