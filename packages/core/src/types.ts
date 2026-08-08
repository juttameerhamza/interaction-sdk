export type Awaitable<T> = T | Promise<T>;

export interface RuntimeSchema<T> {
  parse(input: unknown): T;
  readonly description?: string;
  readonly jsonSchema?: Readonly<Record<string, unknown>>;
  /** Adapter-specific schema object (for example a Zod/Standard Schema instance). */
  readonly native?: unknown;
}

export type ActorType = "user" | "employee" | "partner" | "agent" | "system";

export interface ActorContext {
  type: ActorType;
  id?: string;
  tenantId?: string;
  roles?: readonly string[];
  permissions?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface RuntimeConfig {
  apiUrl: string;
  environment: "development" | "test" | "staging" | "production";
  tenantId?: string;
  sdkVersion?: string;
}

export interface OperationOptions {
  signal?: AbortSignal;
  interactionId?: string;
  idempotencyKey?: string;
}

export interface Disposable {
  dispose(): Awaitable<void>;
}
