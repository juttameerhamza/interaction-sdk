import { defineQuery, scopedQueryKey, type QueryCacheScope, type QueryDefinition } from "@interaction-sdk/core";
import type { Lead } from "./schema.js";
import type { LeadApi } from "./feature.js";

export const leadQueryKeys = {
  all: (scope: QueryCacheScope) => scopedQueryKey(scope, "lead"),
  detail: (scope: QueryCacheScope, id: string) => [...leadQueryKeys.all(scope), "detail", id] as const,
};

export function leadDetailQuery(api: LeadApi, scope: QueryCacheScope, id: string): QueryDefinition<Lead> {
  return defineQuery({
    key: leadQueryKeys.detail(scope, id),
    staleTime: 30_000,
    execute: ({ signal }) => api.get(id, signal ? { signal } : undefined),
  });
}
