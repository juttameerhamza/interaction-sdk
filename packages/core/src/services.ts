import { SdkError } from "./errors.js";

export interface ServiceRegistry {
  register<T>(key: string, service: T): void;
  get<T>(key: string): T;
  has(key: string): boolean;
}

export function createServiceRegistry(): ServiceRegistry {
  const services = new Map<string, unknown>();
  return {
    register(key, service) {
      if (services.has(key)) throw new SdkError(`Service '${key}' is already registered`, "SERVICE_ALREADY_REGISTERED", "unexpected");
      services.set(key, service);
    },
    get(key) {
      if (!services.has(key)) throw new SdkError(`Service '${key}' is not registered`, "SERVICE_NOT_FOUND", "unexpected");
      return services.get(key) as never;
    },
    has(key) { return services.has(key); },
  };
}
