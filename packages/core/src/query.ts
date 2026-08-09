export interface QueryExecutionContext {
  readonly signal?: AbortSignal;
}

export interface QueryCacheScope {
  readonly environment: string;
  readonly tenant: string;
  readonly subject: string;
}

export function createQueryCacheScope(runtime: {
  readonly config: { environment: string; tenantId?: string; sessionId?: string };
  readonly actor: { id?: string; type: string; tenantId?: string };
}): QueryCacheScope {
  const tenant = runtime.actor.tenantId ?? runtime.config.tenantId ?? "default";
  const subject = runtime.actor.id ?? runtime.config.sessionId;
  if (!subject) throw new Error("A stable actor id or runtime sessionId is required for protected query caching");
  return { environment: runtime.config.environment, tenant, subject };
}

export function scopedQueryKey(
  scope: QueryCacheScope,
  feature: string,
  ...parts: readonly unknown[]
): readonly unknown[] {
  return ["interaction-sdk", scope.environment, scope.tenant, scope.subject, feature, ...parts] as const;
}

export interface QueryDefinition<TData> {
  readonly key: readonly unknown[];
  readonly execute: (context: QueryExecutionContext) => Promise<TData>;
  readonly staleTime?: number;
}

export function defineQuery<TData>(definition: QueryDefinition<TData>): QueryDefinition<TData> {
  return definition;
}
