import * as z from "zod/v4";
import { defineMapper, defineTransportContract } from "@interaction-sdk/contracts";
import { LeadSchema, type Lead } from "./schema.js";

export const LeadApiDtoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  campaignId: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

export type LeadApiDto = z.infer<typeof LeadApiDtoSchema>;

export const leadResponseContract = defineTransportContract<LeadApiDto>({
  id: "backend.lead",
  version: "1",
  parse: (input) => LeadApiDtoSchema.parse(input),
});

export const leadMapper = defineMapper<LeadApiDto, Lead>({
  toDomain(dto) {
    return LeadSchema.parse({
      id: dto.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      campaignId: dto.campaignId,
      status: dto.status,
      createdAt: dto.createdAt,
    });
  },
});
