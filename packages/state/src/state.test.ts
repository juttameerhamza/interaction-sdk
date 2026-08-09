import { describe, expect, it } from "vitest";
import { createSdkRuntime, type ApiClient, type PersistenceAdapter } from "@interaction-sdk/core";
import { createPersistedStore, definePersistedStore } from "./index.js";

const api: ApiClient = {
  get: async () => ({} as never), post: async () => ({} as never), put: async () => ({} as never),
  patch: async () => ({} as never), delete: async () => ({} as never),
};

describe("persisted stores", () => {
  it("serializes writes and flushes the latest revision", async () => {
    const values: unknown[] = [];
    const adapter: PersistenceAdapter = {
      get: async () => null,
      async set(_key, value) {
        await new Promise((resolve) => setTimeout(resolve, values.length === 0 ? 10 : 0));
        values.push(value);
      },
      remove: async () => undefined,
    };
    const runtime = createSdkRuntime({
      config: { apiUrl: "unused", environment: "test" }, actor: { type: "user", id: "user-1" }, api,
    });
    const controller = createPersistedStore(runtime, definePersistedStore({
      id: "draft", version: 1, create: () => ({ value: 0 }),
      schema: { parse: (input) => input as number }, select: (state) => state.value,
      merge: (value, state) => ({ ...state, value }),
    }), adapter);
    await controller.hydrate();
    controller.store.setState({ value: 1 });
    controller.store.setState({ value: 2 });
    await controller.flush();

    expect(values).toEqual([
      { version: 1, revision: 1, state: 1 },
      { version: 1, revision: 2, state: 2 },
    ]);
    await controller.dispose();
    expect(controller.status).toBe("disposed");
  });

  it("does not revive a store when hydration finishes after disposal", async () => {
    let resolveGet!: (value: unknown) => void;
    const adapter: PersistenceAdapter = {
      get: () => new Promise((resolve) => { resolveGet = resolve; }),
      set: async () => undefined,
      remove: async () => undefined,
    };
    const runtime = createSdkRuntime({
      config: { apiUrl: "unused", environment: "test" }, actor: { type: "user", id: "user-1" }, api,
    });
    const controller = createPersistedStore(runtime, definePersistedStore({
      id: "draft", version: 1, create: () => ({ value: 0, hydrated: false }),
      schema: { parse: (input) => input as number }, select: (state) => state.value,
      merge: (value, state) => ({ ...state, value }),
      onHydrated: (state) => ({ ...state, hydrated: true }),
    }), adapter);

    const hydration = controller.hydrate();
    await controller.dispose();
    resolveGet({ version: 1, state: 42 });
    await hydration;

    expect(controller.status).toBe("disposed");
    expect(controller.store.getState()).toEqual({ value: 0, hydrated: false });
  });
});
