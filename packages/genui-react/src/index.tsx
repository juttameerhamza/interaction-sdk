import { Fragment, type ComponentType, type ReactNode } from "react";
import type { ActionResult } from "@interaction-sdk/core";
import { validateUiTree, type UiNode, type UiActionBinding, type ValidatedUiNode } from "@interaction-sdk/genui";
import { useSdkRuntime } from "@interaction-sdk/react";

export interface GeneratedComponentProps {
  sdkActions: Readonly<Record<string, (inputOverride?: unknown) => Promise<ActionResult>>>;
  children?: ReactNode;
}

export type GeneratedComponent = ComponentType<Record<string, unknown> & GeneratedComponentProps>;

export interface RendererRegistry {
  register(name: string, component: GeneratedComponent): void;
  get(name: string): GeneratedComponent | undefined;
}

export function createRendererRegistry(initial: Readonly<Record<string, GeneratedComponent>> = {}): RendererRegistry {
  const renderers = new Map(Object.entries(initial));
  return {
    register(name, component) { renderers.set(name, component); },
    get(name) { return renderers.get(name); },
  };
}

function bindingsToActions(
  bindings: readonly UiActionBinding[] | undefined,
  dispatch: (binding: UiActionBinding, inputOverride?: unknown) => Promise<ActionResult>,
): Record<string, (inputOverride?: unknown) => Promise<ActionResult>> {
  return Object.fromEntries((bindings ?? []).map((binding) => [
    binding.event,
    (inputOverride?: unknown) => dispatch(binding, inputOverride),
  ]));
}

function NodeRenderer({ node, registry }: { node: ValidatedUiNode; registry: RendererRegistry }) {
  const runtime = useSdkRuntime();
  const Renderer = registry.get(node.component);
  if (!Renderer) return <div role="alert">Unsupported generated component: <code>{node.component}</code></div>;
  const sdkActions = bindingsToActions(node.actions, (binding, inputOverride) => runtime.actions.dispatch({
    type: binding.action,
    input: inputOverride ?? binding.input ?? {},
  }));

  return <Renderer {...node.props} sdkActions={sdkActions}>
    {node.children?.map((child) => <NodeRenderer key={child.id} node={child} registry={registry} />) ?? null}
  </Renderer>;
}

export function GeneratedUi({ tree, registry }: { tree: UiNode | unknown; registry: RendererRegistry }) {
  const runtime = useSdkRuntime();
  const validated = validateUiTree(runtime, tree);
  return <Fragment><NodeRenderer node={validated} registry={registry} /></Fragment>;
}
