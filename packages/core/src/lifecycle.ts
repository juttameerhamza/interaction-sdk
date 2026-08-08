import type { Awaitable } from "./types.js";

export type DisposeCallback = () => Awaitable<void>;

export interface LifecycleRegistry {
  add(disposable: { dispose(): Awaitable<void> } | DisposeCallback): () => void;
  dispose(): Promise<void>;
  readonly disposed: boolean;
}

export function createLifecycleRegistry(): LifecycleRegistry {
  const callbacks = new Set<DisposeCallback>();
  let isDisposed = false;

  return {
    add(disposable) {
      if (isDisposed) {
        void (typeof disposable === "function" ? disposable() : disposable.dispose());
        return () => undefined;
      }
      const callback = typeof disposable === "function" ? disposable : () => disposable.dispose();
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
    async dispose() {
      if (isDisposed) return;
      isDisposed = true;
      const pending = [...callbacks];
      callbacks.clear();
      const results = await Promise.allSettled(pending.map((callback) => callback()));
      const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      if (rejected) throw rejected.reason;
    },
    get disposed() { return isDisposed; },
  };
}
