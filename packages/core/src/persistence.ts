import { SdkError } from "./errors.js";

export interface PersistenceAdapter {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface PersistenceRegistry {
  register(name: string, adapter: PersistenceAdapter): void;
  get(name: string): PersistenceAdapter;
  has(name: string): boolean;
}

export function createPersistenceRegistry(
  initial: Readonly<Record<string, PersistenceAdapter>> = {},
): PersistenceRegistry {
  const adapters = new Map(Object.entries(initial));
  return {
    register(name, adapter) { adapters.set(name, adapter); },
    get(name) {
      const adapter = adapters.get(name);
      if (!adapter) throw new SdkError(`Persistence adapter '${name}' is not registered`, "PERSISTENCE_ADAPTER_NOT_FOUND", "persistence");
      return adapter;
    },
    has(name) { return adapters.has(name); },
  };
}

export function createMemoryPersistenceAdapter(): PersistenceAdapter {
  const data = new Map<string, unknown>();
  return {
    async get(key) { return data.get(key) ?? null; },
    async set(key, value) { data.set(key, structuredClone(value)); },
    async remove(key) { data.delete(key); },
  };
}

export function createWebStoragePersistenceAdapter(storage: Storage): PersistenceAdapter {
  return {
    async get(key) {
      const value = storage.getItem(key);
      if (value === null) return null;
      try { return JSON.parse(value) as unknown; }
      catch (cause) { throw new SdkError(`Invalid persisted JSON for '${key}'`, "PERSISTENCE_PARSE_FAILED", "persistence", { cause }); }
    },
    async set(key, value) { storage.setItem(key, JSON.stringify(value)); },
    async remove(key) { storage.removeItem(key); },
  };
}
