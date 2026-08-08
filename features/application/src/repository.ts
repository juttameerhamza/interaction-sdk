import { createToken, type ApiClient, type OperationOptions } from "@interaction-sdk/core";
import { ApplicationSchema, type Application, type CreateApplicationInput } from "./schema.js";

export interface ApplicationRepository {
  get(id: string, options?: OperationOptions): Promise<Application>;
  create(input: CreateApplicationInput, options?: OperationOptions): Promise<Application>;
  submit(id: string, options?: OperationOptions): Promise<Application>;
}

export const ApplicationRepositoryToken = createToken<ApplicationRepository>("application.repository");

export class HttpApplicationRepository implements ApplicationRepository {
  constructor(private readonly api: ApiClient) {}

  async get(id: string, options: OperationOptions = {}): Promise<Application> {
    const response = await this.api.get(`/applications/${encodeURIComponent(id)}`, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
    });
    return ApplicationSchema.parse(response);
  }

  async create(input: CreateApplicationInput, options: OperationOptions = {}): Promise<Application> {
    const response = await this.api.post("/applications", input, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
    });
    return ApplicationSchema.parse(response);
  }

  async submit(id: string, options: OperationOptions = {}): Promise<Application> {
    const response = await this.api.post(`/applications/${encodeURIComponent(id)}/submit`, {}, {
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.interactionId ? { interactionId: options.interactionId } : {}),
      ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
    });
    return ApplicationSchema.parse(response);
  }
}

export function createInMemoryApplicationRepository(seed: readonly Application[] = []): ApplicationRepository {
  const applications = new Map(seed.map((application) => [application.id, application]));
  return {
    async get(id) {
      const application = applications.get(id);
      if (!application) throw new Error(`Application '${id}' not found`);
      return application;
    },
    async create(input) {
      const application: Application = {
        id: crypto.randomUUID(),
        leadId: input.leadId,
        status: "draft",
        createdAt: new Date().toISOString(),
        submittedAt: null,
      };
      applications.set(application.id, application);
      return application;
    },
    async submit(id) {
      const existing = applications.get(id);
      if (!existing) throw new Error(`Application '${id}' not found`);
      const application: Application = {
        ...existing,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };
      applications.set(id, application);
      return application;
    },
  };
}
