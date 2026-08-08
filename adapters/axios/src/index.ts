import axios, { AxiosError, type AxiosInstance } from "axios";
import { SdkError, type ApiClient, type ApiRequestOptions, type AuthAdapter } from "@interaction-sdk/core";

export interface CreateAxiosApiClientOptions {
  baseUrl: string;
  auth?: AuthAdapter;
  timeoutMs?: number;
  axiosInstance?: AxiosInstance;
}

function normalizeAxiosError(error: unknown): never {
  if (!axios.isAxiosError(error)) throw error;
  const axiosError = error as AxiosError<{ code?: string; message?: string; correlationId?: string }>;
  const status = axiosError.response?.status;
  const body = axiosError.response?.data;
  let category: SdkError["category"] = "network";
  if (status === 401) category = "authentication";
  else if (status === 403) category = "authorization";
  else if (status === 409) category = "conflict";
  else if (status === 422 || status === 400) category = "validation";
  else if (status === 429) category = "rate-limit";
  throw new SdkError(body?.message ?? axiosError.message, body?.code ?? `HTTP_${status ?? "NETWORK"}`, category, {
    ...(status ? { status } : {}),
    retryable: !status || status >= 500 || status === 429,
    ...(body?.correlationId ? { correlationId: body.correlationId } : {}),
    cause: error,
  });
}

export function createAxiosApiClient(options: CreateAxiosApiClientOptions): ApiClient {
  const client = options.axiosInstance ?? axios.create({ baseURL: options.baseUrl, timeout: options.timeoutMs ?? 20_000 });
  client.interceptors.request.use(async (config) => {
    const token = await options.auth?.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const request = async <T>(method: string, path: string, body: unknown, requestOptions: ApiRequestOptions = {}): Promise<T> => {
    try {
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
    } catch (error) {
      return normalizeAxiosError(error);
    }
  };

  return {
    get: (path, opts) => request("GET", path, undefined, opts),
    post: (path, body, opts) => request("POST", path, body, opts),
    put: (path, body, opts) => request("PUT", path, body, opts),
    patch: (path, body, opts) => request("PATCH", path, body, opts),
    delete: (path, opts) => request("DELETE", path, undefined, opts),
  };
}
