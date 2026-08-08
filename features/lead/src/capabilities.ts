import { defineCapability, type SdkRuntime } from "@interaction-sdk/core";
import { asRuntimeSchema, CreateLeadInputSchema, GetLeadInputSchema, LeadSchema } from "./schema.js";
import { LeadRepositoryToken } from "./repository.js";

export const createLeadCapability = defineCapability({
  name: "lead.create",
  version: 1,
  description: "Create a lead for a campaign.",
  inputSchema: asRuntimeSchema(CreateLeadInputSchema),
  outputSchema: asRuntimeSchema(LeadSchema),
  async execute(input, context) {
    const repository = context.runtime.dependencies.get(LeadRepositoryToken);
    const lead = await repository.create(input, {
      ...(context.signal ? { signal: context.signal } : {}),
      ...(context.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
      interactionId: context.interactionId,
    });
    context.runtime.events.emit("lead.created", { leadId: lead.id, campaignId: lead.campaignId });
    return lead;
  },
});

export const getLeadCapability = defineCapability({
  name: "lead.get",
  version: 1,
  description: "Fetch a lead by id.",
  inputSchema: asRuntimeSchema(GetLeadInputSchema),
  outputSchema: asRuntimeSchema(LeadSchema),
  async execute({ id }, context) {
    return context.runtime.dependencies.get(LeadRepositoryToken).get(id, {
      ...(context.signal ? { signal: context.signal } : {}),
      interactionId: context.interactionId,
    });
  },
});

export function registerLeadCapabilities(runtime: SdkRuntime): void {
  if (!runtime.capabilities.has(createLeadCapability.name)) runtime.capabilities.register(createLeadCapability);
  if (!runtime.capabilities.has(getLeadCapability.name)) runtime.capabilities.register(getLeadCapability);
}
