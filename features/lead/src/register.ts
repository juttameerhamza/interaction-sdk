import type { PersistenceAdapter, SdkRuntime } from "@interaction-sdk/core";
import { registerLeadCapabilities } from "./capabilities.js";
import { registerLeadActions } from "./actions.js";
import { registerLeadComponentCatalog } from "./catalog.js";
import { HttpLeadRepository, LEAD_REPOSITORY, LeadRepositoryToken, type LeadRepository } from "./repository.js";
import { createLeadDraftStore, LEAD_DRAFT_STORE } from "./store.js";

export interface RegisterLeadFeatureOptions {
  repository?: LeadRepository;
  persistence?: PersistenceAdapter;
}

export async function registerLeadFeature(
  runtime: SdkRuntime,
  options: RegisterLeadFeatureOptions = {},
): Promise<void> {
  const repository = options.repository ?? new HttpLeadRepository(runtime.api);

  if (!runtime.dependencies.has(LeadRepositoryToken)) {
    runtime.dependencies.provide(LeadRepositoryToken, repository);
  }

  // Compatibility bridge for integrations still using the legacy string registry.
  if (!runtime.services.has(LEAD_REPOSITORY)) {
    runtime.services.register(LEAD_REPOSITORY, runtime.dependencies.get(LeadRepositoryToken));
  }

  registerLeadCapabilities(runtime);
  registerLeadActions(runtime);
  registerLeadComponentCatalog(runtime);

  if (!runtime.stores.has(LEAD_DRAFT_STORE)) {
    const controller = createLeadDraftStore(runtime, options.persistence);
    runtime.stores.register(LEAD_DRAFT_STORE, controller.store);
    runtime.lifecycle.add(controller);
    await controller.hydrate();
  }
}
