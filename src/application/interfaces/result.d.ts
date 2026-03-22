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

type Awaitable<TValue> = TValue | Promise<TValue>;
type Result<TData> = SuccessResult<TData> | FailureResult;
type CheckHealth = () => Awaitable<Result<HealthStatus>>;

export type {
  ApplicationError,
  Awaitable,
  CheckHealth,
  FailureResult,
  HealthStatus,
  Result,
  SuccessResult,
};
