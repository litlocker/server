interface ApplicationError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

interface HealthStatus {
  status: "ok" | "error";
  details: Record<string, unknown>;
}

interface SuccessResult<TData> {
  success: true;
  data: TData;
}

interface FailureResult {
  success: false;
  error: ApplicationError;
}

type Result<TData> = SuccessResult<TData> | FailureResult;
type CheckHealth = () => Result<HealthStatus>;

export type { ApplicationError, HealthStatus, SuccessResult, FailureResult, Result, CheckHealth };
