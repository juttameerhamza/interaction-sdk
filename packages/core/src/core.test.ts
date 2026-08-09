import { describe, expect, it } from "vitest";
import {
  createSdkRuntime,
  defineAction,
  defineCapability,
  type ApiClient,
  type RuntimeSchema,
} from "./index.js";

const pass = <T>(): RuntimeSchema<T> => ({ parse: (input) => input as T });
const api: ApiClient = {
  get: async () => ({} as never),
  post: async () => ({} as never),
  put: async () => ({} as never),
  patch: async () => ({} as never),
  delete: async () => ({} as never),
};

describe("interaction runtime", () => {
  it("dispatches an action through a capability", async () => {
    const runtime = createSdkRuntime({
      config: { apiUrl: "https://example.test", environment: "test" },
      actor: { type: "user", permissions: ["lead:create"] },
      api,
    });
    runtime.capabilities.register(defineCapability({
      name: "lead.create",
      version: 1,
      inputSchema: pass<{ name: string }>(),
      outputSchema: pass<{ id: string; name: string }>(),
      async execute(input) { return { id: "lead-1", ...input }; },
    }));
    runtime.actions.register(defineAction({
      type: "lead.create",
      capability: "lead.create",
      risk: "write",
      permissions: ["lead:create"],
    }));

    const result = await runtime.actions.dispatch<{ id: string; name: string }>({
      type: "lead.create",
      input: { name: "Ada" },
    });
    expect(result.data).toEqual({ id: "lead-1", name: "Ada" });
  });

  it("does not let telemetry or notification listeners change a successful action", async () => {
    const runtime = createSdkRuntime({
      config: { apiUrl: "https://example.test", environment: "test" },
      actor: { type: "user", id: "user-1", permissions: ["write"] },
      api,
      telemetry: { track: async () => { throw new Error("exporter unavailable"); } },
    });
    runtime.events.on("sdk.action.completed", () => { throw new Error("observer failed"); });
    runtime.capabilities.register(defineCapability({
      name: "test.write",
      version: 1,
      inputSchema: pass<{ value: string }>(),
      outputSchema: pass<{ value: string }>(),
      async execute(input) { return input; },
    }));
    runtime.actions.register(defineAction({ type: "test.write", capability: "test.write", risk: "write", permissions: ["write"] }));

    await expect(runtime.actions.dispatch({ type: "test.write", input: { value: "saved" } }))
      .resolves.toMatchObject({ data: { value: "saved" } });
  });

  it("rejects execution after runtime disposal", async () => {
    const runtime = createSdkRuntime({
      config: { apiUrl: "https://example.test", environment: "test" },
      actor: { type: "system", id: "system" },
      api,
    });
    await runtime.dispose();
    await expect(runtime.actions.dispatch({ type: "missing", input: {} })).rejects.toMatchObject({ code: "RUNTIME_DISPOSED" });
  });
});
