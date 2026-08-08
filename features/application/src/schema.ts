import * as z from "zod/v4";
import type { RuntimeSchema } from "@interaction-sdk/core";

export const ApplicationIdSchema = z.string().min(1);
export const ApplicationStatusSchema = z.enum(["draft", "ready", "submitted"]);

export const CreateApplicationInputSchema = z.object({
  leadId: z.string().min(1),
});

export const GetApplicationInputSchema = z.object({
  id: ApplicationIdSchema,
});

export const SubmitApplicationInputSchema = z.object({
  id: ApplicationIdSchema,
});

export const ApplicationSchema = z.object({
  id: ApplicationIdSchema,
  leadId: z.string().min(1),
  status: ApplicationStatusSchema,
  createdAt: z.string(),
  submittedAt: z.string().nullable(),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationInputSchema>;
export type GetApplicationInput = z.infer<typeof GetApplicationInputSchema>;
export type SubmitApplicationInput = z.infer<typeof SubmitApplicationInputSchema>;

export function asApplicationRuntimeSchema<T>(schema: z.ZodType<T>, description?: string): RuntimeSchema<T> {
  return {
    parse: (input) => schema.parse(input),
    ...(description ? { description } : {}),
    jsonSchema: z.toJSONSchema(schema) as Readonly<Record<string, unknown>>,
    native: schema,
  };
}
