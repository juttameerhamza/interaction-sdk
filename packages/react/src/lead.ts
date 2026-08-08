import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import type { SdkError } from "@interaction-sdk/core";
import {
  LEAD_DRAFT_STORE,
  type CreateLeadInput,
  type Lead,
  type LeadDraftState,
} from "@interaction-sdk/feature-lead";
import { useSdkRuntime } from "./provider.js";

export const leadKeys = {
  all: ["lead"] as const,
  detail: (id: string) => [...leadKeys.all, "detail", id] as const,
};

export function leadQuery(runtime: ReturnType<typeof useSdkRuntime>, id: string) {
  return queryOptions({
    queryKey: leadKeys.detail(id),
    queryFn: async ({ signal }) => {
      const result = await runtime.actions.dispatch<Lead>({
        type: "lead.get",
        input: { id },
        idempotencyKey: `lead.get:${id}`,
      }, { signal });
      return result.data;
    },
  });
}

export interface UseLeadFormControllerOptions {
  campaignId: string;
  onSuccess?: (lead: Lead) => void;
}

export function useLeadFormController(options: UseLeadFormControllerOptions) {
  const runtime = useSdkRuntime();
  const queryClient = useQueryClient();
  const store = runtime.stores.get<LeadDraftState>(LEAD_DRAFT_STORE) as StoreApi<LeadDraftState>;
  const values = useStore(store, (state) => state.values);
  const hydrated = useStore(store, (state) => state.hydrated);

  const mutation = useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const result = await runtime.actions.dispatch<Lead>({
        type: "lead.create",
        input,
        idempotencyKey: crypto.randomUUID(),
      });
      return result.data;
    },
    onSuccess: (lead) => {
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
      store.getState().reset();
      options.onSuccess?.(lead);
    },
  });

  const submit = async () => mutation.mutateAsync({
    ...values,
    phone: values.phone || undefined,
    campaignId: options.campaignId,
  });

  return {
    values,
    hydrated,
    update: store.getState().update,
    reset: store.getState().reset,
    submit,
    isSubmitting: mutation.isPending,
    error: (mutation.error ?? null) as SdkError | null,
    data: mutation.data ?? null,
  };
}
