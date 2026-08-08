import { defineCapability, type SdkRuntime } from "@interaction-sdk/core";
import {
  ApplicationSchema,
  CreateApplicationInputSchema,
  GetApplicationInputSchema,
  SubmitApplicationInputSchema,
  asApplicationRuntimeSchema,
} from "./schema.js";
import { ApplicationRepositoryToken } from "./repository.js";

export const createApplicationCapability = defineCapability({
  name: "application.create",
  version: 1,
  description: "Create an application for a lead.",
  inputSchema: asApplicationRuntimeSchema(CreateApplicationInputSchema),
  outputSchema: asApplicationRuntimeSchema(ApplicationSchema),
  async execute(input, context) {
    return context.runtime.dependencies.get(ApplicationRepositoryToken).create(input, {
      ...(context.signal ? { signal: context.signal } : {}),
      ...(context.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
      interactionId: context.interactionId,
    });
  },
});

export const getApplicationCapability = defineCapability({
  name: "application.get",
  version: 1,
  description: "Fetch an application by id.",
  inputSchema: asApplicationRuntimeSchema(GetApplicationInputSchema),
  outputSchema: asApplicationRuntimeSchema(ApplicationSchema),
  async execute({ id }, context) {
    return context.runtime.dependencies.get(ApplicationRepositoryToken).get(id, {
      ...(context.signal ? { signal: context.signal } : {}),
      interactionId: context.interactionId,
    });
  },
});

export const submitApplicationCapability = defineCapability({
  name: "application.submit",
  version: 1,
  description: "Submit a ready application.",
  inputSchema: asApplicationRuntimeSchema(SubmitApplicationInputSchema),
  outputSchema: asApplicationRuntimeSchema(ApplicationSchema),
  async execute({ id }, context) {
    return context.runtime.dependencies.get(ApplicationRepositoryToken).submit(id, {
      ...(context.signal ? { signal: context.signal } : {}),
      ...(context.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
      interactionId: context.interactionId,
    });
  },
});

export function registerApplicationCapabilities(runtime: SdkRuntime): void {
  for (const capability of [createApplicationCapability, getApplicationCapability, submitApplicationCapability]) {
    if (!runtime.capabilities.has(capability.name)) runtime.capabilities.register(capability);
  }
}
