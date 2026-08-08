import * as z from "zod/v4";
import type { RuntimeSchema } from "@interaction-sdk/core";

export const LeadIdSchema = z.string().min(1);
export const LeadStatusSchema = z.enum(["new", "qualified", "converted", "rejected"]);

export const CreateLeadInputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(7).optional(),
  campaignId: z.string().min(1),
});

export const LeadSchema = z.object({
  id: LeadIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  campaignId: z.string(),
  status: LeadStatusSchema,
  createdAt: z.string(),
});

export const LeadDraftSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const GetLeadInputSchema = z.object({ id: LeadIdSchema });

export type Lead = z.infer<typeof LeadSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadInputSchema>;
export type LeadDraft = z.infer<typeof LeadDraftSchema>;
export type GetLeadInput = z.infer<typeof GetLeadInputSchema>;

export function asRuntimeSchema<T>(schema: z.ZodType<T>, description?: string): RuntimeSchema<T> {
  return {
    parse: (input) => schema.parse(input),
    ...(description ? { description } : {}),
    jsonSchema: z.toJSONSchema(schema) as Readonly<Record<string, unknown>>,
    native: schema,
  };
}
