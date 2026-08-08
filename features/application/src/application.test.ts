import { describe, expect, it } from "vitest";
import { createSdk, type ApiClient } from "@interaction-sdk/core";
import { applicationFeature } from "./feature.js";
import { createInMemoryApplicationRepository } from "./repository.js";

const unusedApi: ApiClient = {
  get: async () => { throw new Error("unused"); },
  post: async () => { throw new Error("unused"); },
  put: async () => { throw new Error("unused"); },
  patch: async () => { throw new Error("unused"); },
  delete: async () => { throw new Error("unused"); },
};

describe("application feature facade", () => {
  it("creates and submits through the public SDK API", async () => {
    const sdk = await createSdk({
      config: { apiUrl: "http://unused", environment: "test" },
      actor: {
        type: "user",
        id: "user-1",
        permissions: ["application:create", "application:read", "application:submit"],
      },
      api: unusedApi,
      features: [applicationFeature({ repository: createInMemoryApplicationRepository() })] as const,
    });

    const created = await sdk.application.create({ leadId: "lead-1" }, { idempotencyKey: "create-1" });
    expect(created.status).toBe("draft");

    const submitted = await sdk.application.submit(created.id, { idempotencyKey: "submit-1" });
    expect(submitted.status).toBe("submitted");
    expect(sdk.manifest().features).toContainEqual({ id: "application", version: "1.0.0" });

    await sdk.runtime.dispose();
  });
});
