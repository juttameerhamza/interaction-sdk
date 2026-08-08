import type { SdkRuntime } from "./runtime.js";
import type { ActorContext, RuntimeSchema } from "./types.js";
import { SdkError } from "./errors.js";

export interface CapabilityContext {
  runtime: SdkRuntime;
  actor: ActorContext;
  interactionId: string;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export interface Capability<TInput = unknown, TOutput = unknown> {
  name: string;
  version: number;
  description?: string;
  inputSchema: RuntimeSchema<TInput>;
  outputSchema: RuntimeSchema<TOutput>;
  execute(input: TInput, context: CapabilityContext): Promise<TOutput>;
}

export interface CapabilityExecuteOptions {
  actor?: ActorContext;
  interactionId?: string;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export interface CapabilityDescription {
  name: string;
  version: number;
  description?: string;
  inputSchema?: Readonly<Record<string, unknown>>;
  outputSchema?: Readonly<Record<string, unknown>>;
}

export interface CapabilityRegistry {
  register<TInput, TOutput>(capability: Capability<TInput, TOutput>): void;
  get(name: string): Capability;
  has(name: string): boolean;
  list(): readonly Capability[];
  execute<TOutput = unknown>(name: string, input: unknown, options?: CapabilityExecuteOptions): Promise<TOutput>;
  describe(name?: string): readonly CapabilityDescription[];
}

export function defineCapability<TInput, TOutput>(capability: Capability<TInput, TOutput>): Capability<TInput, TOutput> {
  return capability;
}

export function createCapabilityRegistry(getRuntime: () => SdkRuntime): CapabilityRegistry {
  const capabilities = new Map<string, Capability>();
  return {
    register(capability) {
      if (capabilities.has(capability.name)) {
        throw new SdkError(`Capability '${capability.name}' is already registered`, "CAPABILITY_ALREADY_REGISTERED", "unexpected");
      }
      capabilities.set(capability.name, capability as Capability);
    },
    get(name) {
      const capability = capabilities.get(name);
      if (!capability) throw new SdkError(`Capability '${name}' is not registered`, "CAPABILITY_NOT_FOUND", "protocol");
      return capability;
    },
    has(name) { return capabilities.has(name); },
    list() { return [...capabilities.values()]; },
    async execute<TOutput>(name: string, input: unknown, options: CapabilityExecuteOptions = {}) {
      const runtime = getRuntime();
      const capability = this.get(name);
      const parsedInput = capability.inputSchema.parse(input);
      const interactionId = options.interactionId ?? crypto.randomUUID();
      const context: CapabilityContext = {
        runtime,
        actor: options.actor ?? runtime.actor,
        interactionId,
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
      };
      const output = await capability.execute(parsedInput, context);
      return capability.outputSchema.parse(output) as TOutput;
    },
    describe(name) {
      const selected = name ? [this.get(name)] : [...capabilities.values()];
      return selected.map((capability) => ({
        name: capability.name,
        version: capability.version,
        ...(capability.description ? { description: capability.description } : {}),
        ...(capability.inputSchema.jsonSchema ? { inputSchema: capability.inputSchema.jsonSchema } : {}),
        ...(capability.outputSchema.jsonSchema ? { outputSchema: capability.outputSchema.jsonSchema } : {}),
      }));
    },
  };
}
