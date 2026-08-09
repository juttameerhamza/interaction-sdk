import type { StoreApi } from "zustand/vanilla";
import type { PersistenceAdapter, SdkRuntime } from "@interaction-sdk/core";
import { createPersistedStore, definePersistedStore } from "@interaction-sdk/state";
import { asRuntimeSchema, LeadDraftSchema, type LeadDraft } from "./schema.js";

export const LEAD_DRAFT_STORE = "lead.draft";
const EMPTY_DRAFT: LeadDraft = { firstName: "", lastName: "", email: "", phone: "" };

export interface LeadDraftState {
  values: LeadDraft;
  hydrated: boolean;
  update(field: keyof LeadDraft, value: string): void;
  reset(): void;
}

export interface LeadDraftStoreController {
  store: StoreApi<LeadDraftState>;
  readonly status: "idle" | "hydrating" | "hydrated" | "failed" | "disposed";
  readonly revision: number;
  hydrate(): Promise<void>;
  flush(): Promise<void>;
  dispose(): Promise<void>;
}

export const leadDraftStoreDefinition = definePersistedStore<LeadDraftState, LeadDraft>({
  id: LEAD_DRAFT_STORE,
  version: 1,
  storage: "memory",
  scope: "actor",
  schema: asRuntimeSchema(LeadDraftSchema),
  create: (set) => ({
    values: EMPTY_DRAFT,
    hydrated: false,
    update(field, value) {
      set((state) => ({ values: { ...state.values, [field]: value } }));
    },
    reset() {
      set({ values: EMPTY_DRAFT });
    },
  }),
  select: (state) => state.values,
  merge: (persisted, current) => ({ ...current, values: persisted }),
  onHydrated: (current) => ({ ...current, hydrated: true }),
});

export function createLeadDraftStore(
  runtime: SdkRuntime,
  persistence?: PersistenceAdapter,
): LeadDraftStoreController {
  return createPersistedStore(runtime, leadDraftStoreDefinition, persistence);
}
