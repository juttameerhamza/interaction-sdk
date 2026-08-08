import * as z from "zod/v4";
import { UiNodeSchema, type UiNode } from "@interaction-sdk/genui";

const CognigyPluginEnvelopeSchema = z.object({
  data: z.object({
    _plugin: z.object({
      type: z.literal("interaction-sdk"),
      ui: UiNodeSchema,
    }),
  }),
});

export function toCognigyPluginData(ui: UiNode) {
  return { _plugin: { type: "interaction-sdk" as const, ui: UiNodeSchema.parse(ui) } };
}

export function fromCognigyMessage(message: unknown): UiNode | null {
  const result = CognigyPluginEnvelopeSchema.safeParse(message);
  return result.success ? result.data.data._plugin.ui : null;
}
