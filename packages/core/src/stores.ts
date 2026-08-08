import { SdkError } from "./errors.js";

export interface StoreLike<TState> {
  getState(): TState;
  setState(partial: Partial<TState> | ((state: TState) => Partial<TState>), replace?: false): void;
  subscribe(listener: (state: TState, previousState: TState) => void): () => void;
}

export interface StoreRegistry {
  register<TState>(key: string, store: StoreLike<TState>): void;
  get<TState>(key: string): StoreLike<TState>;
  has(key: string): boolean;
  remove(key: string): void;
}

export function createStoreRegistry(): StoreRegistry {
  const stores = new Map<string, StoreLike<unknown>>();
  return {
    register(key, store) {
      if (stores.has(key)) throw new SdkError(`Store '${key}' is already registered`, "STORE_ALREADY_REGISTERED", "unexpected");
      stores.set(key, store as StoreLike<unknown>);
    },
    get<TState>(key: string): StoreLike<TState> {
      const store = stores.get(key);
      if (!store) throw new SdkError(`Store '${key}' is not registered`, "STORE_NOT_FOUND", "unexpected");
      return store as StoreLike<TState>;
    },
    has(key) { return stores.has(key); },
    remove(key) { stores.delete(key); },
  };
}
