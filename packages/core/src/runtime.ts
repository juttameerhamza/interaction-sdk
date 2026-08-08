import type { ActorContext, RuntimeConfig } from "./types.js";
import type { ApiClient } from "./api.js";
import type { AuthAdapter } from "./auth.js";
import type { TelemetryAdapter } from "./telemetry.js";
import type { ErrorManager } from "./errors.js";
import type { PersistenceAdapter, PersistenceRegistry } from "./persistence.js";
import type { EventBus } from "./events.js";
import type { StoreRegistry } from "./stores.js";
import type { ServiceRegistry } from "./services.js";
import type { CapabilityRegistry } from "./capabilities.js";
import type { PolicyEngine } from "./policies.js";
import type { ActionDispatcher, ConfirmationAdapter } from "./actions.js";
import type { ContextRegistry } from "./context.js";
import type { ComponentCatalog } from "./components.js";
import type { LifecycleRegistry } from "./lifecycle.js";
import { anonymousAuthAdapter } from "./auth.js";
import { noopTelemetry } from "./telemetry.js";
import { createErrorManager } from "./errors.js";
import { createPersistenceRegistry, createMemoryPersistenceAdapter } from "./persistence.js";
import { createEventBus } from "./events.js";
import { createStoreRegistry } from "./stores.js";
import { createServiceRegistry } from "./services.js";
import { createCapabilityRegistry } from "./capabilities.js";
import { createPolicyEngine } from "./policies.js";
import { createActionDispatcher, denyRequiredConfirmation } from "./actions.js";
import { createContextRegistry } from "./context.js";
import { createComponentCatalog } from "./components.js";
import { createLifecycleRegistry } from "./lifecycle.js";

export interface SdkRuntime {
  readonly config: RuntimeConfig;
  readonly actor: ActorContext;
  readonly api: ApiClient;
  readonly auth: AuthAdapter;
  readonly telemetry: TelemetryAdapter;
  readonly errors: ErrorManager;
  readonly persistence: PersistenceRegistry;
  readonly events: EventBus;
  readonly stores: StoreRegistry;
  readonly services: ServiceRegistry;
  readonly capabilities: CapabilityRegistry;
  readonly policies: PolicyEngine;
  readonly actions: ActionDispatcher;
  readonly confirmations: ConfirmationAdapter;
  readonly context: ContextRegistry;
  readonly components: ComponentCatalog;
  readonly lifecycle: LifecycleRegistry;
  dispose(): Promise<void>;
}

export interface CreateSdkRuntimeOptions {
  config: RuntimeConfig;
  actor: ActorContext;
  api: ApiClient;
  auth?: AuthAdapter;
  telemetry?: TelemetryAdapter;
  errors?: ErrorManager;
  confirmations?: ConfirmationAdapter;
  persistence?: Readonly<Record<string, PersistenceAdapter>>;
}

export function createSdkRuntime(options: CreateSdkRuntimeOptions): SdkRuntime {
  let runtime!: SdkRuntime;
  const persistence = createPersistenceRegistry({
    memory: createMemoryPersistenceAdapter(),
    ...(options.persistence ?? {}),
  });
  const capabilities = createCapabilityRegistry(() => runtime);
  const actions = createActionDispatcher(() => runtime);
  const lifecycle = createLifecycleRegistry();

  runtime = {
    config: options.config,
    actor: options.actor,
    api: options.api,
    auth: options.auth ?? anonymousAuthAdapter,
    telemetry: options.telemetry ?? noopTelemetry,
    errors: options.errors ?? createErrorManager(),
    persistence,
    events: createEventBus(),
    stores: createStoreRegistry(),
    services: createServiceRegistry(),
    capabilities,
    policies: createPolicyEngine(),
    actions,
    confirmations: options.confirmations ?? denyRequiredConfirmation,
    context: createContextRegistry(),
    components: createComponentCatalog(),
    lifecycle,
    dispose: () => lifecycle.dispose(),
  };

  return runtime;
}
