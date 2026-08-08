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
  actions?: UiActionBinding[];
  children?: UiNode[];
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
  children?: ValidatedUiNode[];
}

export function validateUiTree(
  runtime: SdkRuntime,
  input: unknown,
  actor: ActorContext = runtime.actor,
): ValidatedUiNode {
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
  const children = node.children?.map((child) => validateUiTree(runtime, child, actor));
  return {
    ...node,
    props,
    ...(children ? { children } : {}),
  };
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
