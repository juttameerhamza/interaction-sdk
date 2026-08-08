import { defineFeature, type OperationOptions } from "@interaction-sdk/core";
import type { CreateLeadInput, Lead } from "./schema.js";
import type { RegisterLeadFeatureOptions } from "./register.js";
import { registerLeadFeature } from "./register.js";

export interface LeadApi {
  create(input: CreateLeadInput, options?: OperationOptions): Promise<Lead>;
  get(id: string, options?: OperationOptions): Promise<Lead>;
}

export function leadFeature(options: RegisterLeadFeatureOptions = {}) {
  return defineFeature({
    id: "lead",
    version: "1.0.0",
    async install({ runtime }): Promise<LeadApi> {
      await registerLeadFeature(runtime, options);
      return {
        async create(input, operation = {}) {
          const result = await runtime.actions.dispatch<Lead>({
            type: "lead.create",
            input,
            ...(operation.interactionId ? { interactionId: operation.interactionId } : {}),
            ...(operation.idempotencyKey ? { idempotencyKey: operation.idempotencyKey } : {}),
          }, operation.signal ? { signal: operation.signal } : undefined);
          return result.data;
        },
        async get(id, operation = {}) {
          const result = await runtime.actions.dispatch<Lead>({
            type: "lead.get",
            input: { id },
            ...(operation.interactionId ? { interactionId: operation.interactionId } : {}),
            ...(operation.idempotencyKey ? { idempotencyKey: operation.idempotencyKey } : {}),
          }, operation.signal ? { signal: operation.signal } : undefined);
          return result.data;
        },
      };
    },
  });
}
