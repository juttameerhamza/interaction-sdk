import { defineQuery, type QueryDefinition } from "@interaction-sdk/core";
import type { Lead } from "./schema.js";
import type { LeadApi } from "./feature.js";

export const leadQueryKeys = {
  all: ["lead"] as const,
  detail: (id: string) => [...leadQueryKeys.all, "detail", id] as const,
};

export function leadDetailQuery(api: LeadApi, id: string): QueryDefinition<Lead> {
  return defineQuery({
    key: leadQueryKeys.detail(id),
    staleTime: 30_000,
    execute: ({ signal }) => api.get(id, signal ? { signal } : undefined),
  });
}
