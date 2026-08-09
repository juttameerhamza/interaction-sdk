export type EventMap = Record<string, unknown>;
export type Unsubscribe = () => void;

export interface EventBus<TEvents extends EventMap = EventMap> {
  emit<TKey extends keyof TEvents & string>(name: TKey, payload: TEvents[TKey]): void;
  on<TKey extends keyof TEvents & string>(name: TKey, handler: (payload: TEvents[TKey]) => void): Unsubscribe;
}

export interface EventBusOptions {
  readonly onListenerError?: (error: unknown, eventName: string) => void;
}

export function createEventBus<TEvents extends EventMap = EventMap>(options: EventBusOptions = {}): EventBus<TEvents> {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  return {
    emit(name, payload) {
      listeners.get(name)?.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          try { options.onListenerError?.(error, name); } catch { /* diagnostics never change application behavior */ }
        }
      });
    },
    on(name, handler) {
      const set = listeners.get(name) ?? new Set<(payload: unknown) => void>();
      const wrapped = handler as (payload: unknown) => void;
      set.add(wrapped);
      listeners.set(name, set);
      return () => set.delete(wrapped);
    },
  };
}
