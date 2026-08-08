import type { ActorContext, Awaitable, RuntimeSchema } from "./types.js";
import { SdkError } from "./errors.js";

export interface ContextDefinition<T> {
  name: string;
  schema: RuntimeSchema<T>;
  visibility: readonly ActorContext["type"][];
  resolve(actor: ActorContext): Awaitable<T>;
}

export interface ContextRegistry {
  register<T>(definition: ContextDefinition<T>): void;
  resolve(name: string, actor: ActorContext): Promise<unknown>;
  resolveVisible(actor: ActorContext): Promise<Readonly<Record<string, unknown>>>;
}

export function createContextRegistry(): ContextRegistry {
  const definitions = new Map<string, ContextDefinition<unknown>>();
  return {
    register(definition) {
      if (definitions.has(definition.name)) {
        throw new SdkError(`Context '${definition.name}' is already registered`, "CONTEXT_ALREADY_REGISTERED", "unexpected");
      }
      definitions.set(definition.name, definition as ContextDefinition<unknown>);
    },
    async resolve(name, actor) {
      const definition = definitions.get(name);
      if (!definition || !definition.visibility.includes(actor.type)) return undefined;
      return definition.schema.parse(await definition.resolve(actor));
    },
    async resolveVisible(actor) {
      const entries = await Promise.all([...definitions.values()]
        .filter((definition) => definition.visibility.includes(actor.type))
        .map(async (definition) => [definition.name, definition.schema.parse(await definition.resolve(actor))] as const));
      return Object.fromEntries(entries);
    },
  };
}
