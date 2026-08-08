import {
  createSdkRuntime,
  createWebStoragePersistenceAdapter,
  type SdkRuntime,
} from "@interaction-sdk/core";
import { createAxiosApiClient } from "@interaction-sdk/adapter-axios";
import { registerLeadFeature } from "@interaction-sdk/feature-lead";
import { createDemoRuntime } from "@interaction-sdk/testing";

export async function createExampleRuntime(): Promise<SdkRuntime> {
  const persistence = createWebStoragePersistenceAdapter(sessionStorage);
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (!apiUrl) return createDemoRuntime({ persistence });

  const auth = { getAccessToken: async () => null };
  const api = createAxiosApiClient({ baseUrl: apiUrl, auth });
  const runtime = createSdkRuntime({
    config: { apiUrl, environment: "development", tenantId: "vite-example", sdkVersion: "0.1.0" },
    actor: {
      type: "user",
      id: "vite-user",
      tenantId: "vite-example",
      permissions: ["lead:create", "lead:read"],
    },
    api,
    auth,
    persistence: { session: persistence },
    confirmations: { confirm: async () => true },
  });

  await registerLeadFeature(runtime, { persistence });
  return runtime;
}
