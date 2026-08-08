import type { QueryClient } from "@tanstack/react-query";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import type { SdkRuntime } from "@interaction-sdk/core";
import { LEAD_DRAFT_STORE, type LeadDraftState } from "@interaction-sdk/feature-lead";
import { SdkProvider } from "@interaction-sdk/react";
function Inspector({ runtime }: { runtime: SdkRuntime }) {
  const store = runtime.stores.get<LeadDraftState>(LEAD_DRAFT_STORE) as StoreApi<LeadDraftState>;
  const values = useStore(store, (state) => state.values);
  return <aside><h2>Draft remote</h2><p>This is a separate federated bundle reading the exact same host-owned Zustand store instance.</p><pre>{JSON.stringify(values, null, 2)}</pre></aside>;
}
export default function DraftInspector({ runtime, queryClient }: { runtime: SdkRuntime; queryClient: QueryClient }) {
  return <SdkProvider runtime={runtime} queryClient={queryClient}><Inspector runtime={runtime} /></SdkProvider>;
}
