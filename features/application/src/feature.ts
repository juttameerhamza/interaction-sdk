import { defineFeature, type OperationOptions } from "@interaction-sdk/core";
import type { Application, CreateApplicationInput } from "./schema.js";
import type { RegisterApplicationFeatureOptions } from "./register.js";
import { registerApplicationFeature } from "./register.js";

export interface ApplicationApi {
  create(input: CreateApplicationInput, options?: OperationOptions): Promise<Application>;
  get(id: string, options?: OperationOptions): Promise<Application>;
  submit(id: string, options?: OperationOptions): Promise<Application>;
}

export function applicationFeature(options: RegisterApplicationFeatureOptions = {}) {
  return defineFeature({
    id: "application",
    version: "1.0.0",
    install({ runtime }): ApplicationApi {
      registerApplicationFeature(runtime, options);
      return {
        async create(input, operation = {}) {
          const result = await runtime.actions.dispatch<Application>({
            type: "application.create",
            input,
            ...(operation.interactionId ? { interactionId: operation.interactionId } : {}),
            ...(operation.idempotencyKey ? { idempotencyKey: operation.idempotencyKey } : {}),
          }, operation.signal ? { signal: operation.signal } : undefined);
          return result.data;
        },
        async get(id, operation = {}) {
          const result = await runtime.actions.dispatch<Application>({
            type: "application.get",
            input: { id },
            ...(operation.interactionId ? { interactionId: operation.interactionId } : {}),
            ...(operation.idempotencyKey ? { idempotencyKey: operation.idempotencyKey } : {}),
          }, operation.signal ? { signal: operation.signal } : undefined);
          return result.data;
        },
        async submit(id, operation = {}) {
          const result = await runtime.actions.dispatch<Application>({
            type: "application.submit",
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
