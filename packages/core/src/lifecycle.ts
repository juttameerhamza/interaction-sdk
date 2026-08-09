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
      const pending = [...callbacks].reverse();
      callbacks.clear();
      let firstError: unknown;
      for (const callback of pending) {
        try { await callback(); }
        catch (error) { firstError ??= error; }
      }
      if (firstError) throw firstError;
    },
    get disposed() { return isDisposed; },
  };
}
