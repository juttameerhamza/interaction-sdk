export interface QueryExecutionContext {
  readonly signal?: AbortSignal;
}

export interface QueryDefinition<TData> {
  readonly key: readonly unknown[];
  readonly execute: (context: QueryExecutionContext) => Promise<TData>;
  readonly staleTime?: number;
}

export function defineQuery<TData>(definition: QueryDefinition<TData>): QueryDefinition<TData> {
  return definition;
}
