import { CheckHealth } from "./result.d.ts";

type BackgroundJobType =
  | "extract-embedded-metadata"
  | "lookup-external-metadata"
  | "finalize-import"
  | "extract-cover";

interface BackgroundJob {
  id: string;
  type: BackgroundJobType;
  importJobId: string;
  payload: Record<string, unknown>;
}

interface EnqueueBackgroundJobInput {
  type: BackgroundJobType;
  importJobId: string;
  payload?: Record<string, unknown>;
}

interface RunBackgroundJobInput {
  id: string;
}

type EnqueueBackgroundJob = ({ job }: { job: EnqueueBackgroundJobInput }) => BackgroundJob;
type GetBackgroundJob = ({ id }: { id: string }) => BackgroundJob | null;
type ListBackgroundJobs = () => BackgroundJob[];
type RunBackgroundJob = ({ job }: { job: RunBackgroundJobInput }) => { success: boolean };

interface BackgroundJobRunner {
  enqueue: EnqueueBackgroundJob;
  get: GetBackgroundJob;
  list: ListBackgroundJobs;
  run: RunBackgroundJob;
  checkHealth: CheckHealth;
}

type CreateBackgroundJobRunner = () => BackgroundJobRunner;

export type { BackgroundJobRunner, CreateBackgroundJobRunner };
