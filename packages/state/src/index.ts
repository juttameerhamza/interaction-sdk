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
  readonly status: "idle" | "hydrating" | "hydrated" | "failed" | "disposed";
  readonly revision: number;
  hydrate(): Promise<void>;
  flush(): Promise<void>;
  dispose(): Promise<void>;
}

export function definePersistedStore<TState, TPersisted>(
  definition: PersistedStoreDefinition<TState, TPersisted>,
): PersistedStoreDefinition<TState, TPersisted> {
  return definition;
}

function scopedKey(runtime: SdkRuntime, definition: PersistedStoreDefinition<unknown, unknown>): string {
  const scope = definition.scope ?? "actor";
  const tenant = runtime.actor.tenantId ?? runtime.config.tenantId ?? "default";
  const actor = runtime.actor.id ?? runtime.config.sessionId;
  if (scope === "actor" && !actor) {
    throw new Error(`Persisted store '${definition.id}' requires an actor id or runtime sessionId`);
  }
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
  let revision = 0;
  let status: PersistedStoreController<TState>["status"] = "idle";
  let writes = Promise.resolve();
  let hydration: Promise<void> | undefined;

  const report = (error: unknown, subsystem: string) => {
    const normalized = runtime.errors.normalize(error);
    try { runtime.errors.report(normalized, { subsystem, store: definition.id, key }); } catch { /* observational */ }
  };

  const unsubscribe = store.subscribe((state, previous) => {
    revision += 1;
    if (!persistenceEnabled) return;
    const selected = definition.select(state);
    const previousSelected = definition.select(previous);
    if (Object.is(selected, previousSelected)) return;

    const writeRevision = revision;
    writes = writes
      .then(() => adapter.set(key, { version: definition.version, revision: writeRevision, state: selected }))
      .catch((error) => report(error, "persisted-store"));
  });

  const controller: PersistedStoreController<TState> = {
    store,
    get status() { return status; },
    get revision() { return revision; },
    hydrate() {
      if (hydration) return hydration;
      if (status === "disposed") return Promise.reject(new Error(`Persisted store '${definition.id}' is disposed`));
      status = "hydrating";
      const startingRevision = revision;
      hydration = (async () => {
        try {
          const envelope = await adapter.get(key);
          if (envelope && typeof envelope === "object" && "state" in envelope) {
            const raw = envelope as { version?: unknown; revision?: unknown; state?: unknown };
            const fromVersion = typeof raw.version === "number" ? raw.version : definition.version;
            const persisted = fromVersion === definition.version
              ? definition.schema.parse(raw.state)
              : definition.migrate
                ? definition.migrate(raw.state, fromVersion)
                : undefined;

            // User edits made while storage was loading always win.
            if (persisted !== undefined && revision === startingRevision) {
              if (typeof raw.revision === "number") revision = Math.max(revision, raw.revision);
              store.setState(definition.merge(persisted, store.getState()), true);
            }
          }
          status = "hydrated";
        } catch (error) {
          status = "failed";
          report(error, "persisted-store-hydration");
        } finally {
          if (definition.onHydrated) store.setState(definition.onHydrated(store.getState()), true);
          persistenceEnabled = true;
        }
      })();
      return hydration;
    },
    flush() {
      return writes;
    },
    async dispose() {
      if (status === "disposed") return;
      unsubscribe();
      await writes;
      status = "disposed";
    },
  };
  return controller;
}
