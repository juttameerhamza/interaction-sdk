import {
  createSdkRuntime,
  type ActorContext,
  type ApiClient,
  type PersistenceAdapter,
  type SdkRuntime,
} from "@interaction-sdk/core";
import { createInMemoryLeadRepository, registerLeadFeature } from "@interaction-sdk/feature-lead";

export const throwingApiClient: ApiClient = {
  async get() { throw new Error("No HTTP backend configured in test runtime"); },
  async post() { throw new Error("No HTTP backend configured in test runtime"); },
  async put() { throw new Error("No HTTP backend configured in test runtime"); },
  async patch() { throw new Error("No HTTP backend configured in test runtime"); },
  async delete() { throw new Error("No HTTP backend configured in test runtime"); },
};

export interface CreateDemoRuntimeOptions {
  actor?: ActorContext;
  persistence?: PersistenceAdapter;
}

export async function createDemoRuntime(options: CreateDemoRuntimeOptions = {}): Promise<SdkRuntime> {
  const actor: ActorContext = options.actor ?? {
    type: "user",
    id: "demo-user",
    tenantId: "demo",
    permissions: ["lead:create", "lead:read"],
  };
  const runtime = createSdkRuntime({
    config: { apiUrl: "https://api.example.invalid", environment: "development", tenantId: "demo", sdkVersion: "0.1.0" },
    actor,
    api: throwingApiClient,
    ...(options.persistence ? { persistence: { session: options.persistence } } : {}),
    confirmations: { confirm: () => true },
    telemetry: {
      track(event) { if (typeof console !== "undefined") console.debug("[sdk]", event.name, event.properties ?? {}); },
    },
  });
  await registerLeadFeature(runtime, {
    repository: createInMemoryLeadRepository(),
    ...(options.persistence ? { persistence: options.persistence } : {}),
  });
  return runtime;
}
