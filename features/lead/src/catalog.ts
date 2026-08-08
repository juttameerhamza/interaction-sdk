import type { SdkRuntime } from "@interaction-sdk/core";
import * as z from "zod/v4";
import { asRuntimeSchema } from "./schema.js";

const LeadFormCatalogPropsSchema = z.object({
  campaignId: z.string().min(1),
  title: z.string().optional(),
});

export function registerLeadComponentCatalog(runtime: SdkRuntime): void {
  if (runtime.components.has("LeadForm")) return;
  runtime.components.register({
    name: "LeadForm",
    version: 1,
    description: "Collects contact details and creates a lead for a campaign.",
    propsSchema: asRuntimeSchema(LeadFormCatalogPropsSchema),
    actions: ["lead.create"],
    permissions: ["lead:create"],
    slots: ["header", "submitButton", "success", "error"],
    visibleTo: ["user", "employee", "partner", "agent"],
  });
}
