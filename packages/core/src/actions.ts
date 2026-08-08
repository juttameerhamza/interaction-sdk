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

export interface ActionExecutionContext {
  readonly runtime: SdkRuntime;
  readonly action: ActionDefinition;
  readonly request: ActionRequest;
  readonly options: ActionDispatchOptions;
  readonly actor: ActorContext;
  readonly actionId: string;
  readonly interactionId: string;
}

export type ActionNext = () => Promise<ActionResult<unknown>>;
export type ActionMiddleware = (context: ActionExecutionContext, next: ActionNext) => Promise<ActionResult<unknown>>;

export interface ActionDispatcher {
  register(action: ActionDefinition): void;
  get(type: string): ActionDefinition;
  has(type: string): boolean;
  list(): readonly ActionDefinition[];
  use(middleware: ActionMiddleware): void;
  dispatch<TOutput = unknown>(request: ActionRequest, options?: ActionDispatchOptions): Promise<ActionResult<TOutput>>;
}

export function defineAction(action: ActionDefinition): ActionDefinition {
  return action;
}

export const denyRequiredConfirmation: ConfirmationAdapter = {
  confirm: () => false,
};

function compose(middleware: readonly ActionMiddleware[], terminal: ActionNext, context: ActionExecutionContext): Promise<ActionResult<unknown>> {
  let index = -1;
  const run = (position: number): Promise<ActionResult<unknown>> => {
    if (position <= index) return Promise.reject(new SdkError("Action middleware called next() more than once", "ACTION_MIDDLEWARE_REENTRY", "unexpected"));
    index = position;
    const current = middleware[position];
    return current ? current(context, () => run(position + 1)) : terminal();
  };
  return run(0);
}

function errorBoundary(): ActionMiddleware {
  return async (context, next) => {
    try {
      return await next();
    } catch (error) {
      const normalized = context.runtime.errors.normalize(error);
      context.runtime.errors.report(normalized, {
        actionId: context.actionId,
        interactionId: context.interactionId,
        actionType: context.action.type,
      });
      context.runtime.events.emit("sdk.action.failed", {
        actionId: context.actionId,
        interactionId: context.interactionId,
        actionType: context.action.type,
        error: normalized,
      });
      await context.runtime.telemetry.track({
        name: "sdk.action.failed",
        timestamp: Date.now(),
        interactionId: context.interactionId,
        properties: {
          actionId: context.actionId,
          actionType: context.action.type,
          errorCode: normalized.code,
        },
      });
      throw normalized;
    }
  };
}

function telemetry(): ActionMiddleware {
  return async (context, next) => {
    await context.runtime.telemetry.track({
      name: "sdk.action.started",
      timestamp: Date.now(),
      interactionId: context.interactionId,
      properties: {
        actionId: context.actionId,
        actionType: context.action.type,
        actorType: context.actor.type,
        risk: context.action.risk,
      },
    });
    const result = await next();
    context.runtime.events.emit("sdk.action.completed", {
      actionId: context.actionId,
      interactionId: context.interactionId,
      actionType: context.action.type,
    });
    await context.runtime.telemetry.track({
      name: "sdk.action.completed",
      timestamp: Date.now(),
      interactionId: context.interactionId,
      properties: { actionId: context.actionId, actionType: context.action.type },
    });
    return result;
  };
}

function policyAndConfirmation(): ActionMiddleware {
  return async (context, next) => {
    const decision = await context.runtime.policies.evaluate({
      actor: context.actor,
      action: context.action,
      risk: context.action.risk,
    });
    if (!decision.allowed) {
      throw new SdkError(decision.reason ?? "Action denied by policy", "ACTION_DENIED", "authorization", {
        metadata: { actionType: context.action.type },
      });
    }
    if (decision.confirmation === "required") {
      const approved = await context.runtime.confirmations.confirm({
        action: context.action,
        actor: context.actor,
        input: context.request.input,
        interactionId: context.interactionId,
      });
      if (!approved) throw new SdkError("Action confirmation was declined", "ACTION_CONFIRMATION_DECLINED", "business");
    }
    return next();
  };
}

export function createActionDispatcher(getRuntime: () => SdkRuntime): ActionDispatcher {
  const actions = new Map<string, ActionDefinition>();
  const inflight = new Map<string, Promise<ActionResult<unknown>>>();
  const customMiddleware: ActionMiddleware[] = [];
  const builtIns = [errorBoundary(), telemetry(), policyAndConfirmation()] as const;

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
    use(middleware) { customMiddleware.push(middleware); },
    async dispatch<TOutput>(request: ActionRequest, options: ActionDispatchOptions = {}) {
      const runtime = getRuntime();
      const action = this.get(request.type);
      const actor = options.actor ?? runtime.actor;
      const interactionId = request.interactionId ?? crypto.randomUUID();
      const actionId = crypto.randomUUID();
      const cacheKey = action.idempotent && request.idempotencyKey ? `${action.type}:${request.idempotencyKey}` : undefined;

      if (cacheKey) {
        const existing = inflight.get(cacheKey);
        if (existing) return existing as Promise<ActionResult<TOutput>>;
      }

      const context: ActionExecutionContext = {
        runtime,
        action,
        request,
        options,
        actor,
        actionId,
        interactionId,
      };

      const terminal = async (): Promise<ActionResult<unknown>> => {
        const data = await runtime.capabilities.execute(action.capability, request.input, {
          actor,
          interactionId,
          ...(options.signal ? { signal: options.signal } : {}),
          ...(request.idempotencyKey ? { idempotencyKey: request.idempotencyKey } : {}),
        });
        return { ok: true, actionId, interactionId, data };
      };

      const operation = compose([...builtIns, ...customMiddleware], terminal, context);
      if (cacheKey) {
        inflight.set(cacheKey, operation);
        operation.finally(() => inflight.delete(cacheKey)).catch(() => undefined);
      }
      return operation as Promise<ActionResult<TOutput>>;
    },
  };
}
