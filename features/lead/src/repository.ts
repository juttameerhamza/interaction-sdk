import { createToken, type ApiClient, type OperationOptions } from "@interaction-sdk/core";
import { type CreateLeadInput, type Lead } from "./schema.js";
import { leadMapper, leadResponseContract } from "./transport.js";

/** @deprecated Use `LeadRepositoryToken` in new feature code. */
export const LEAD_REPOSITORY = "lead.repository";

export interface LeadRepository {
  get(id: string, options?: OperationOptions): Promise<Lead>;
  create(input: CreateLeadInput, options?: OperationOptions): Promise<Lead>;
}

export const LeadRepositoryToken = createToken<LeadRepository>("lead.repository");

export class HttpLeadRepository implements LeadRepository {
  constructor(private readonly api: ApiClient) {}

  async get(id: string, options: OperationOptions = {}): Promise<Lead> {
    const response = await this.api.get(`/leads/${encodeURIComponent(id)}`, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
    });
    return leadMapper.toDomain(leadResponseContract.parse(response));
  }

  async create(input: CreateLeadInput, options: OperationOptions = {}): Promise<Lead> {
    const response = await this.api.post("/leads", input, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
    });
    return leadMapper.toDomain(leadResponseContract.parse(response));
  }
}

export function createInMemoryLeadRepository(seed: readonly Lead[] = []): LeadRepository {
  const leads = new Map(seed.map((lead) => [lead.id, lead]));
  return {
    async get(id) {
      const lead = leads.get(id);
      if (!lead) throw new Error(`Lead '${id}' not found`);
      return lead;
    },
    async create(input) {
      const lead: Lead = {
        id: crypto.randomUUID(),
        ...input,
        phone: input.phone ?? null,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      leads.set(lead.id, lead);
      return lead;
    },
  };
}
