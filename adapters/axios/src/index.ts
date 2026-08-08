import axios, { AxiosError, type AxiosInstance } from "axios";
import {
  executeWithRetry,
  noRetryPolicy,
  SdkError,
  type ApiClient,
  type ApiRequestOptions,
  type AuthAdapter,
  type RetryPolicy,
} from "@interaction-sdk/core";

export interface CreateAxiosApiClientOptions {
  baseUrl: string;
  auth?: AuthAdapter;
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
  axiosInstance?: AxiosInstance;
}

function normalizeAxiosError(error: unknown): SdkError {
  if (error instanceof SdkError) return error;
  if (!axios.isAxiosError(error)) {
    return new SdkError("Unexpected transport failure", "HTTP_UNEXPECTED", "unexpected", { cause: error });
  }
  const axiosError = error as AxiosError<{ code?: string; message?: string; correlationId?: string }>;
  const status = axiosError.response?.status;
  const body = axiosError.response?.data;
  let category: SdkError["category"] = "network";
  if (status === 401) category = "authentication";
  else if (status === 403) category = "authorization";
  else if (status === 409) category = "conflict";
  else if (status === 422 || status === 400) category = "validation";
  else if (status === 429) category = "rate-limit";
  return new SdkError(body?.message ?? axiosError.message, body?.code ?? `HTTP_${status ?? "NETWORK"}`, category, {
    ...(status ? { status } : {}),
    retryable: !status || status >= 500 || status === 429,
    ...(body?.correlationId ? { correlationId: body.correlationId } : {}),
    cause: error,
  });
}

export function createAxiosApiClient(options: CreateAxiosApiClientOptions): ApiClient {
  const client = options.axiosInstance ?? axios.create({ baseURL: options.baseUrl, timeout: options.timeoutMs ?? 20_000 });
  const retryPolicy = options.retryPolicy ?? noRetryPolicy;

  client.interceptors.request.use(async (config) => {
    const token = await options.auth?.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const request = async <T>(method: string, path: string, body: unknown, requestOptions: ApiRequestOptions = {}): Promise<T> => {
    const idempotent = method === "GET" || Boolean(requestOptions.idempotencyKey);
    return executeWithRetry(
      async () => {
        const response = await client.request<T>({
          method,
          url: path,
          ...(body !== undefined ? { data: body } : {}),
          ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
          headers: {
            ...requestOptions.headers,
            ...(requestOptions.idempotencyKey ? { "Idempotency-Key": requestOptions.idempotencyKey } : {}),
            ...(requestOptions.interactionId ? { "X-Interaction-Id": requestOptions.interactionId } : {}),
          },
        });
        return response.data;
      },
      {
        policy: retryPolicy,
        operation: `${method} ${path}`,
        idempotent,
        normalizeError: normalizeAxiosError,
        ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
      },
    );
  };

  return {
    get: (path, opts) => request("GET", path, undefined, opts),
    post: (path, body, opts) => request("POST", path, body, opts),
    put: (path, body, opts) => request("PUT", path, body, opts),
    patch: (path, body, opts) => request("PATCH", path, body, opts),
    delete: (path, opts) => request("DELETE", path, undefined, opts),
  };
}
