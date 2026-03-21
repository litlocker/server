interface ApplicationError {
  code: string;
  message: string;
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

export type { ApplicationError, SuccessResult, FailureResult, Result };
