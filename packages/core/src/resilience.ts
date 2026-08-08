import type { SdkError } from "./errors.js";

export interface RetryContext {
  readonly attempt: number;
  readonly error: SdkError;
  readonly operation: string;
  readonly idempotent: boolean;
}

export interface RetryDecision {
  readonly retry: boolean;
  readonly delayMs?: number;
}

export interface RetryPolicy {
  decide(context: RetryContext): RetryDecision;
}

export const noRetryPolicy: RetryPolicy = {
  decide: () => ({ retry: false }),
};

export function createExponentialRetryPolicy(options: {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
} = {}): RetryPolicy {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 2_000;

  return {
    decide({ attempt, error, idempotent }) {
      if (!idempotent || !error.retryable || attempt >= maxAttempts) return { retry: false };
      return {
        retry: true,
        delayMs: Math.min(baseDelayMs * 2 ** Math.max(0, attempt - 1), maxDelayMs),
      };
    },
  };
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: {
    readonly policy: RetryPolicy;
    readonly operation: string;
    readonly idempotent: boolean;
    readonly normalizeError: (error: unknown) => SdkError;
    readonly signal?: AbortSignal;
  },
): Promise<T> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await operation();
    } catch (error) {
      const normalized = options.normalizeError(error);
      const decision = options.policy.decide({ attempt, error: normalized, operation: options.operation, idempotent: options.idempotent });
      if (!decision.retry) throw normalized;
      if (options.signal?.aborted) throw normalized;
      const delayMs = decision.delayMs ?? 0;
      if (delayMs > 0) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, delayMs);
          options.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(normalized);
          }, { once: true });
        });
      }
    }
  }
}
