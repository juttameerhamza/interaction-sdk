export type SdkErrorCategory =
  | "network"
  | "authentication"
  | "authorization"
  | "validation"
  | "business"
  | "conflict"
  | "rate-limit"
  | "timeout"
  | "cancelled"
  | "protocol"
  | "persistence"
  | "unexpected";

export interface SdkErrorOptions {
  retryable?: boolean;
  status?: number;
  correlationId?: string;
  metadata?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}

export class SdkError extends Error {
  readonly retryable: boolean;
  readonly status: number | undefined;
  readonly correlationId: string | undefined;
  readonly metadata: Readonly<Record<string, unknown>> | undefined;
  override readonly cause: unknown;

  constructor(
    message: string,
    readonly code: string,
    readonly category: SdkErrorCategory,
    options: SdkErrorOptions = {},
  ) {
    super(message);
    this.name = "SdkError";
    this.retryable = options.retryable ?? false;
    this.status = options.status;
    this.correlationId = options.correlationId;
    this.metadata = options.metadata;
    this.cause = options.cause;
  }
}

export interface ErrorManager {
  normalize(error: unknown): SdkError;
  report(error: SdkError, context?: Readonly<Record<string, unknown>>): void;
}

export function createErrorManager(
  reporter?: (error: SdkError, context?: Readonly<Record<string, unknown>>) => void,
): ErrorManager {
  return {
    normalize(error) {
      if (error instanceof SdkError) return error;
      if (error instanceof DOMException && error.name === "AbortError") {
        return new SdkError("Operation cancelled", "OPERATION_CANCELLED", "cancelled", { cause: error });
      }
      if (error instanceof Error) {
        return new SdkError(error.message, "UNEXPECTED_ERROR", "unexpected", { cause: error });
      }
      return new SdkError("Unexpected error", "UNEXPECTED_ERROR", "unexpected", { cause: error });
    },
    report(error, context) {
      reporter?.(error, context);
    },
  };
}
