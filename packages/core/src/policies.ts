import type { ActorContext, Awaitable } from "./types.js";
import type { ActionDefinition, ActionRisk } from "./actions.js";

export type ConfirmationRequirement = "none" | "required";

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  confirmation: ConfirmationRequirement;
}

export interface PolicyContext {
  actor: ActorContext;
  action: ActionDefinition;
  risk: ActionRisk;
}

export type Policy = (context: PolicyContext) => Awaitable<PolicyDecision | null>;

export interface PolicyEngine {
  use(policy: Policy): void;
  evaluate(context: PolicyContext): Promise<PolicyDecision>;
}

function hasPermissions(actor: ActorContext, required: readonly string[]): boolean {
  if (required.length === 0) return true;
  const granted = new Set(actor.permissions ?? []);
  return required.every((permission) => granted.has(permission));
}

export function createPolicyEngine(): PolicyEngine {
  const policies: Policy[] = [];
  return {
    use(policy) { policies.push(policy); },
    async evaluate(context) {
      if (!hasPermissions(context.actor, context.action.permissions ?? [])) {
        return { allowed: false, reason: "Missing required permission", confirmation: "none" };
      }

      let confirmation: ConfirmationRequirement =
        context.action.confirmation === "required" ||
        (context.action.confirmation === "required-for-agent" && context.actor.type === "agent")
          ? "required"
          : "none";

      for (const policy of policies) {
        const decision = await policy(context);
        if (!decision) continue;
        if (!decision.allowed) return decision;
        if (decision.confirmation === "required") confirmation = "required";
      }
      return { allowed: true, confirmation };
    },
  };
}
