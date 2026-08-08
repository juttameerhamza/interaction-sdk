import type { ActorContext, Awaitable } from "./types.js";
import type { SdkRuntime } from "./runtime.js";
import { SdkError } from "./errors.js";

export type ActionRisk = "read" | "write" | "sensitive-write" | "financial" | "destructive";
export type ActionConfirmation = "none" | "required" | "required-for-agent";

export interface ActionDefinition {
  type: string;
  capability: string;
  description?: string;
  risk: ActionRisk;
  permissions?: readonly string[];
  confirmation?: ActionConfirmation;
  idempotent?: boolean;
}

export interface ActionRequest<TInput = unknown> {
  type: string;
  input: TInput;
  interactionId?: string;
  idempotencyKey?: string;
}

export interface ActionDispatchOptions {
  actor?: ActorContext;
  signal?: AbortSignal;
}

export interface ActionResult<TOutput = unknown> {
  ok: true;
  actionId: string;
  interactionId: string;
  data: TOutput;
}

export interface ConfirmationRequest {
  action: ActionDefinition;
  actor: ActorContext;
  input: unknown;
  interactionId: string;
}

export interface ConfirmationAdapter {
  confirm(request: ConfirmationRequest): Awaitable<boolean>;
}

export interface ActionDispatcher {
  register(action: ActionDefinition): void;
  get(type: string): ActionDefinition;
  has(type: string): boolean;
  list(): readonly ActionDefinition[];
  dispatch<TOutput = unknown>(request: ActionRequest, options?: ActionDispatchOptions): Promise<ActionResult<TOutput>>;
}

export function defineAction(action: ActionDefinition): ActionDefinition {
  return action;
}

export const denyRequiredConfirmation: ConfirmationAdapter = {
  confirm: () => false,
};

export function createActionDispatcher(getRuntime: () => SdkRuntime): ActionDispatcher {
  const actions = new Map<string, ActionDefinition>();
  const inflight = new Map<string, Promise<ActionResult<unknown>>>();

  return {
    register(action) {
      if (actions.has(action.type)) {
        throw new SdkError(`Action '${action.type}' is already registered`, "ACTION_ALREADY_REGISTERED", "unexpected");
      }
      actions.set(action.type, action);
    },
    get(type) {
      const action = actions.get(type);
      if (!action) throw new SdkError(`Action '${type}' is not registered`, "ACTION_NOT_FOUND", "protocol");
      return action;
    },
    has(type) { return actions.has(type); },
    list() { return [...actions.values()]; },
    async dispatch<TOutput>(request: ActionRequest, options: ActionDispatchOptions = {}) {
      const runtime = getRuntime();
      const action = this.get(request.type);
      const actor = options.actor ?? runtime.actor;
      const interactionId = request.interactionId ?? crypto.randomUUID();
      const actionId = crypto.randomUUID();
      const idempotencyKey = request.idempotencyKey;
      const cacheKey = action.idempotent && idempotencyKey ? `${action.type}:${idempotencyKey}` : undefined;

      if (cacheKey) {
        const existing = inflight.get(cacheKey);
        if (existing) return existing as Promise<ActionResult<TOutput>>;
      }

      const operation = (async (): Promise<ActionResult<TOutput>> => {
        await runtime.telemetry.track({
          name: "sdk.action.started",
          timestamp: Date.now(),
          interactionId,
          properties: { actionId, actionType: action.type, actorType: actor.type, risk: action.risk },
        });

        try {
          const decision = await runtime.policies.evaluate({ actor, action, risk: action.risk });
          if (!decision.allowed) {
            throw new SdkError(decision.reason ?? "Action denied by policy", "ACTION_DENIED", "authorization", {
              metadata: { actionType: action.type },
            });
          }

          if (decision.confirmation === "required") {
            const approved = await runtime.confirmations.confirm({ action, actor, input: request.input, interactionId });
            if (!approved) throw new SdkError("Action confirmation was declined", "ACTION_CONFIRMATION_DECLINED", "business");
          }

          const data = await runtime.capabilities.execute<TOutput>(action.capability, request.input, {
            actor,
            interactionId,
            ...(options.signal ? { signal: options.signal } : {}),
            ...(idempotencyKey ? { idempotencyKey } : {}),
          });

          runtime.events.emit("sdk.action.completed", { actionId, interactionId, actionType: action.type });
          await runtime.telemetry.track({
            name: "sdk.action.completed",
            timestamp: Date.now(),
            interactionId,
            properties: { actionId, actionType: action.type },
          });
          return { ok: true, actionId, interactionId, data };
        } catch (error) {
          const normalized = runtime.errors.normalize(error);
          runtime.errors.report(normalized, { actionId, interactionId, actionType: action.type });
          runtime.events.emit("sdk.action.failed", { actionId, interactionId, actionType: action.type, error: normalized });
          await runtime.telemetry.track({
            name: "sdk.action.failed",
            timestamp: Date.now(),
            interactionId,
            properties: { actionId, actionType: action.type, errorCode: normalized.code },
          });
          throw normalized;
        }
      })();

      if (cacheKey) {
        inflight.set(cacheKey, operation as Promise<ActionResult<unknown>>);
        operation.finally(() => inflight.delete(cacheKey)).catch(() => undefined);
      }
      return operation;
    },
  };
}
