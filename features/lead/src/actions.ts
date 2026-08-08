import { defineAction, type SdkRuntime } from "@interaction-sdk/core";

export const createLeadAction = defineAction({
  type: "lead.create",
  capability: "lead.create",
  description: "Create a new lead.",
  risk: "write",
  permissions: ["lead:create"],
  confirmation: "none",
  idempotent: true,
});

export const getLeadAction = defineAction({
  type: "lead.get",
  capability: "lead.get",
  description: "Read an existing lead.",
  risk: "read",
  permissions: ["lead:read"],
  confirmation: "none",
  idempotent: true,
});

export function registerLeadActions(runtime: SdkRuntime): void {
  if (!runtime.actions.has(createLeadAction.type)) runtime.actions.register(createLeadAction);
  if (!runtime.actions.has(getLeadAction.type)) runtime.actions.register(getLeadAction);
}
