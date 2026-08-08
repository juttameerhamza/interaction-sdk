import { defineAction, type SdkRuntime } from "@interaction-sdk/core";

export const createApplicationAction = defineAction({
  type: "application.create",
  capability: "application.create",
  description: "Create an application.",
  risk: "write",
  permissions: ["application:create"],
  confirmation: "none",
  idempotent: true,
});

export const getApplicationAction = defineAction({
  type: "application.get",
  capability: "application.get",
  description: "Read an application.",
  risk: "read",
  permissions: ["application:read"],
  confirmation: "none",
  idempotent: true,
});

export const submitApplicationAction = defineAction({
  type: "application.submit",
  capability: "application.submit",
  description: "Submit an application.",
  risk: "sensitive-write",
  permissions: ["application:submit"],
  confirmation: "required-for-agent",
  idempotent: true,
});

export function registerApplicationActions(runtime: SdkRuntime): void {
  for (const action of [createApplicationAction, getApplicationAction, submitApplicationAction]) {
    if (!runtime.actions.has(action.type)) runtime.actions.register(action);
  }
}
