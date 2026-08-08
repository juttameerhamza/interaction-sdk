import type { QueryClient } from "@tanstack/react-query";
import type { SdkRuntime } from "@interaction-sdk/core";
import { SdkProvider } from "@interaction-sdk/react";
import { LeadForm } from "@interaction-sdk/components/lead";
export default function LeadWidget({ runtime, queryClient }: { runtime: SdkRuntime; queryClient: QueryClient }) {
  return <SdkProvider runtime={runtime} queryClient={queryClient}><LeadForm campaignId="mfe-shared" title="Lead remote" /></SdkProvider>;
}
