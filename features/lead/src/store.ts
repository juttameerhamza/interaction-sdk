import { createStore, type StoreApi } from "zustand/vanilla";
import type { PersistenceAdapter, SdkRuntime } from "@interaction-sdk/core";
import { LeadDraftSchema, type LeadDraft } from "./schema.js";

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
  hydrate(): Promise<void>;
  dispose(): void;
}

function storageKey(runtime: SdkRuntime): string {
  const tenant = runtime.actor.tenantId ?? runtime.config.tenantId ?? "default";
  const actor = runtime.actor.id ?? runtime.actor.type;
  return `interaction-sdk:${tenant}:${actor}:lead-draft:v1`;
}

export function createLeadDraftStore(
  runtime: SdkRuntime,
  persistence: PersistenceAdapter = runtime.persistence.get("memory"),
): LeadDraftStoreController {
  const key = storageKey(runtime);
  const store = createStore<LeadDraftState>((set) => ({
    values: EMPTY_DRAFT,
    hydrated: false,
    update(field, value) {
      set((state) => ({ values: { ...state.values, [field]: value } }));
    },
    reset() { set({ values: EMPTY_DRAFT }); },
  }));

  let persistenceEnabled = false;
  const unsubscribe = store.subscribe((state, previous) => {
    if (!persistenceEnabled || state.values === previous.values) return;
    void persistence.set(key, { version: 1, state: state.values }).catch((error) => {
      const normalized = runtime.errors.normalize(error);
      runtime.errors.report(normalized, { subsystem: "lead-draft-persistence", key });
    });
  });

  return {
    store,
    async hydrate() {
      const value = await persistence.get(key);
      if (value && typeof value === "object" && "state" in value) {
        const parsed = LeadDraftSchema.safeParse((value as { state?: unknown }).state);
        if (parsed.success) store.setState({ values: parsed.data });
        else runtime.errors.report(runtime.errors.normalize(parsed.error), { subsystem: "lead-draft-hydration", key });
      }
      store.setState({ hydrated: true });
      persistenceEnabled = true;
    },
    dispose() { unsubscribe(); },
  };
}
