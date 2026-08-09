import * as z from "zod/v4";
import { SdkError, type ActorContext, type SdkRuntime } from "@interaction-sdk/core";

export const UiActionBindingSchema = z.object({
  event: z.string().min(1),
  action: z.string().min(1),
  input: z.unknown().optional(),
});

export type UiActionBinding = z.infer<typeof UiActionBindingSchema>;

export interface UiNode {
  id: string;
  component: string;
  props: Record<string, unknown>;
  actions?: UiActionBinding[] | undefined;
  children?: UiNode[] | undefined;
}

export const UiNodeSchema: z.ZodType<UiNode> = z.lazy(() => z.object({
  id: z.string().min(1),
  component: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
  actions: z.array(UiActionBindingSchema).optional(),
  children: z.array(UiNodeSchema).optional(),
}));

export interface ValidatedUiNode extends UiNode {
  props: Record<string, unknown>;
  children?: ValidatedUiNode[] | undefined;
}

export interface UiValidationLimits {
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxChildrenPerNode: number;
  readonly maxActionsPerNode: number;
  readonly maxPayloadBytes: number;
}

export const defaultUiValidationLimits: UiValidationLimits = {
  maxDepth: 20,
  maxNodes: 250,
  maxChildrenPerNode: 50,
  maxActionsPerNode: 20,
  maxPayloadBytes: 256_000,
};

export type UiValidationResult =
  | { readonly ok: true; readonly tree: ValidatedUiNode }
  | { readonly ok: false; readonly error: SdkError };

function assertTreeComplexity(input: unknown, limits: UiValidationLimits): void {
  let encoded: string;
  try { encoded = JSON.stringify(input); }
  catch (cause) { throw new SdkError("Generated UI must be serializable", "GENUI_NOT_SERIALIZABLE", "protocol", { cause }); }
  if (new TextEncoder().encode(encoded).byteLength > limits.maxPayloadBytes) {
    throw new SdkError("Generated UI payload is too large", "GENUI_PAYLOAD_LIMIT", "protocol");
  }

  const stack: Array<{ value: unknown; depth: number }> = [{ value: input, depth: 1 }];
  const ids = new Set<string>();
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.depth > limits.maxDepth) throw new SdkError("Generated UI is too deeply nested", "GENUI_DEPTH_LIMIT", "protocol");
    if (!current.value || typeof current.value !== "object" || Array.isArray(current.value)) continue;
    nodes += 1;
    if (nodes > limits.maxNodes) throw new SdkError("Generated UI contains too many nodes", "GENUI_NODE_LIMIT", "protocol");
    const record = current.value as Record<string, unknown>;
    if (typeof record.id === "string") {
      if (ids.has(record.id)) throw new SdkError(`Duplicate generated UI node id '${record.id}'`, "GENUI_DUPLICATE_ID", "protocol");
      ids.add(record.id);
    }
    if (Array.isArray(record.actions) && record.actions.length > limits.maxActionsPerNode) {
      throw new SdkError("Generated UI node contains too many actions", "GENUI_ACTION_LIMIT", "protocol");
    }
    if (Array.isArray(record.children)) {
      if (record.children.length > limits.maxChildrenPerNode) {
        throw new SdkError("Generated UI node contains too many children", "GENUI_CHILD_LIMIT", "protocol");
      }
      for (const child of record.children) stack.push({ value: child, depth: current.depth + 1 });
    }
  }
}

export function validateUiTree(
  runtime: SdkRuntime,
  input: unknown,
  actor: ActorContext = runtime.actor,
  limits: UiValidationLimits = defaultUiValidationLimits,
): ValidatedUiNode {
  assertTreeComplexity(input, limits);
  const node = UiNodeSchema.parse(input);
  const definition = runtime.components.get(node.component);

  if (!runtime.components.isVisible(definition, actor)) {
    throw new SdkError(`Component '${node.component}' is not available to actor '${actor.type}'`, "GENUI_COMPONENT_FORBIDDEN", "authorization");
  }

  const allowedActions = new Set(definition.actions ?? []);
  for (const binding of node.actions ?? []) {
    if (!allowedActions.has(binding.action)) {
      throw new SdkError(
        `Action '${binding.action}' is not allowed by component '${node.component}'`,
        "GENUI_ACTION_FORBIDDEN",
        "protocol",
      );
    }
    const action = runtime.actions.get(binding.action);
    const granted = new Set(actor.permissions ?? []);
    const missingPermission = (action.permissions ?? []).find((permission) => !granted.has(permission));
    if (missingPermission) {
      throw new SdkError(
        `Action '${binding.action}' is not available to actor '${actor.type}'`,
        "GENUI_ACTION_FORBIDDEN",
        "authorization",
      );
    }
  }

  const props = definition.propsSchema.parse(node.props) as Record<string, unknown>;
  const children = node.children?.map((child) => validateUiTreeValidated(runtime, child, actor));
  return {
    ...node,
    props,
    ...(children ? { children } : {}),
  };
}

function validateUiTreeValidated(runtime: SdkRuntime, node: UiNode, actor: ActorContext): ValidatedUiNode {
  const definition = runtime.components.get(node.component);
  if (!runtime.components.isVisible(definition, actor)) {
    throw new SdkError(`Component '${node.component}' is not available to actor '${actor.type}'`, "GENUI_COMPONENT_FORBIDDEN", "authorization");
  }
  const allowedActions = new Set(definition.actions ?? []);
  for (const binding of node.actions ?? []) {
    if (!allowedActions.has(binding.action)) throw new SdkError(`Action '${binding.action}' is not allowed by component '${node.component}'`, "GENUI_ACTION_FORBIDDEN", "protocol");
    const action = runtime.actions.get(binding.action);
    const granted = new Set(actor.permissions ?? []);
    if ((action.permissions ?? []).some((permission) => !granted.has(permission))) {
      throw new SdkError(`Action '${binding.action}' is not available to actor '${actor.type}'`, "GENUI_ACTION_FORBIDDEN", "authorization");
    }
  }
  const props = definition.propsSchema.parse(node.props) as Record<string, unknown>;
  const children = node.children?.map((child) => validateUiTreeValidated(runtime, child, actor));
  return { ...node, props, ...(children ? { children } : {}) };
}

export function safeValidateUiTree(
  runtime: SdkRuntime,
  input: unknown,
  actor: ActorContext = runtime.actor,
  limits: UiValidationLimits = defaultUiValidationLimits,
): UiValidationResult {
  try {
    return { ok: true, tree: validateUiTree(runtime, input, actor, limits) };
  } catch (error) {
    return { ok: false, error: runtime.errors.normalize(error) };
  }
}

export interface GenUiManifest {
  sdkVersion?: string;
  actorType: ActorContext["type"];
  context: Readonly<Record<string, unknown>>;
  capabilities: ReturnType<SdkRuntime["capabilities"]["describe"]>;
  components: ReturnType<SdkRuntime["components"]["list"]>;
  actions: ReturnType<SdkRuntime["actions"]["list"]>;
}

export async function createGenUiManifest(runtime: SdkRuntime, actor: ActorContext = runtime.actor): Promise<GenUiManifest> {
  const actions = [];
  for (const action of runtime.actions.list()) {
    const decision = await runtime.policies.evaluate({ actor, action, risk: action.risk });
    if (decision.allowed) actions.push(action);
  }
  const allowedCapabilities = new Set(actions.map((action) => action.capability));
  const capabilities = runtime.capabilities
    .describe()
    .filter((capability) => allowedCapabilities.has(capability.name));

  return {
    ...(runtime.config.sdkVersion ? { sdkVersion: runtime.config.sdkVersion } : {}),
    actorType: actor.type,
    context: await runtime.context.resolveVisible(actor),
    capabilities,
    components: runtime.components.list(actor),
    actions,
  };
}
