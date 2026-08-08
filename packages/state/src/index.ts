import { createStore, type StateCreator, type StoreApi } from "zustand/vanilla";
import type { PersistenceAdapter, RuntimeSchema, SdkRuntime } from "@interaction-sdk/core";

export type PersistenceScope = "global" | "tenant" | "actor";

export interface PersistedStoreDefinition<TState, TPersisted> {
  readonly id: string;
  readonly version: number;
  readonly storage?: string;
  readonly scope?: PersistenceScope;
  readonly create: StateCreator<TState>;
  readonly schema: RuntimeSchema<TPersisted>;
  readonly select: (state: TState) => TPersisted;
  readonly merge: (persisted: TPersisted, current: TState) => TState;
  readonly migrate?: (persisted: unknown, fromVersion: number) => TPersisted;
  readonly onHydrated?: (current: TState) => TState;
}

export interface PersistedStoreController<TState> {
  readonly store: StoreApi<TState>;
  hydrate(): Promise<void>;
  dispose(): void;
}

export function definePersistedStore<TState, TPersisted>(
  definition: PersistedStoreDefinition<TState, TPersisted>,
): PersistedStoreDefinition<TState, TPersisted> {
  return definition;
}

function scopedKey(runtime: SdkRuntime, definition: PersistedStoreDefinition<unknown, unknown>): string {
  const scope = definition.scope ?? "actor";
  const tenant = runtime.actor.tenantId ?? runtime.config.tenantId ?? "default";
  const actor = runtime.actor.id ?? runtime.actor.type;
  const namespace = scope === "global" ? "global" : scope === "tenant" ? tenant : `${tenant}:${actor}`;
  return `interaction-sdk:${namespace}:${definition.id}`;
}

export function createPersistedStore<TState, TPersisted>(
  runtime: SdkRuntime,
  definition: PersistedStoreDefinition<TState, TPersisted>,
  persistence?: PersistenceAdapter,
): PersistedStoreController<TState> {
  const adapter = persistence ?? runtime.persistence.get(definition.storage ?? "memory");
  const key = scopedKey(runtime, definition as PersistedStoreDefinition<unknown, unknown>);
  const store = createStore<TState>(definition.create);
  let persistenceEnabled = false;

  const unsubscribe = store.subscribe((state, previous) => {
    if (!persistenceEnabled) return;
    const selected = definition.select(state);
    const previousSelected = definition.select(previous);
    if (Object.is(selected, previousSelected)) return;

    void adapter.set(key, { version: definition.version, state: selected }).catch((error) => {
      const normalized = runtime.errors.normalize(error);
      runtime.errors.report(normalized, { subsystem: "persisted-store", store: definition.id, key });
    });
  });

  return {
    store,
    async hydrate() {
      try {
        const envelope = await adapter.get(key);
        if (envelope && typeof envelope === "object" && "state" in envelope) {
          const raw = envelope as { version?: unknown; state?: unknown };
          const fromVersion = typeof raw.version === "number" ? raw.version : definition.version;
          const persisted = fromVersion === definition.version
            ? definition.schema.parse(raw.state)
            : definition.migrate
              ? definition.migrate(raw.state, fromVersion)
              : undefined;

          if (persisted !== undefined) {
            store.setState(definition.merge(persisted, store.getState()), true);
          }
        }
      } catch (error) {
        const normalized = runtime.errors.normalize(error);
        runtime.errors.report(normalized, { subsystem: "persisted-store-hydration", store: definition.id, key });
      } finally {
        if (definition.onHydrated) {
          store.setState(definition.onHydrated(store.getState()), true);
        }
        persistenceEnabled = true;
      }
    },
    dispose() {
      unsubscribe();
    },
  };
}
