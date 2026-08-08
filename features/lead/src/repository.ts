import type { ApiClient, OperationOptions } from "@interaction-sdk/core";
import { LeadSchema, type CreateLeadInput, type Lead } from "./schema.js";

export const LEAD_REPOSITORY = "lead.repository";

export interface LeadRepository {
  get(id: string, options?: OperationOptions): Promise<Lead>;
  create(input: CreateLeadInput, options?: OperationOptions): Promise<Lead>;
}

export class HttpLeadRepository implements LeadRepository {
  constructor(private readonly api: ApiClient) {}

  async get(id: string, options: OperationOptions = {}): Promise<Lead> {
    const response = await this.api.get(`/leads/${encodeURIComponent(id)}`, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
    });
    return LeadSchema.parse(response);
  }

  async create(input: CreateLeadInput, options: OperationOptions = {}): Promise<Lead> {
    const response = await this.api.post("/leads", input, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
    });
    return LeadSchema.parse(response);
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
