import { queryOptions } from "@tanstack/react-query";
import type { QueryDefinition } from "@interaction-sdk/core";

export function toQueryOptions<TData>(definition: QueryDefinition<TData>) {
  return queryOptions({
    queryKey: definition.key,
    queryFn: ({ signal }) => definition.execute({ signal }),
    ...(definition.staleTime !== undefined ? { staleTime: definition.staleTime } : {}),
  });
}
