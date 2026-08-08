import type { ActorContext, ActorType, RuntimeSchema } from "./types.js";
import { SdkError } from "./errors.js";

export interface UiComponentDefinition<TProps = unknown> {
  name: string;
  version: number;
  description: string;
  propsSchema: RuntimeSchema<TProps>;
  actions?: readonly string[];
  slots?: readonly string[];
  visibleTo?: readonly ActorType[];
  permissions?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ComponentCatalog {
  register<TProps>(definition: UiComponentDefinition<TProps>): void;
  get(name: string): UiComponentDefinition;
  list(actor?: ActorContext | ActorType): readonly UiComponentDefinition[];
  isVisible(definition: UiComponentDefinition, actor: ActorContext): boolean;
  has(name: string): boolean;
}

function hasPermissions(actor: ActorContext, required: readonly string[] = []): boolean {
  const granted = new Set(actor.permissions ?? []);
  return required.every((permission) => granted.has(permission));
}

export function createComponentCatalog(): ComponentCatalog {
  const definitions = new Map<string, UiComponentDefinition>();
  const isVisible = (definition: UiComponentDefinition, actor: ActorContext): boolean =>
    (!definition.visibleTo || definition.visibleTo.includes(actor.type)) &&
    hasPermissions(actor, definition.permissions);

  return {
    register(definition) {
      if (definitions.has(definition.name)) {
        throw new SdkError(`UI component '${definition.name}' is already registered`, "UI_COMPONENT_ALREADY_REGISTERED", "unexpected");
      }
      definitions.set(definition.name, definition as UiComponentDefinition);
    },
    get(name) {
      const definition = definitions.get(name);
      if (!definition) throw new SdkError(`UI component '${name}' is not registered`, "UI_COMPONENT_NOT_FOUND", "protocol");
      return definition;
    },
    list(actor) {
      const values = [...definitions.values()];
      if (!actor) return values;
      if (typeof actor === "string") {
        return values.filter((item) => !item.visibleTo || item.visibleTo.includes(actor));
      }
      return values.filter((item) => isVisible(item, actor));
    },
    isVisible,
    has(name) { return definitions.has(name); },
  };
}
