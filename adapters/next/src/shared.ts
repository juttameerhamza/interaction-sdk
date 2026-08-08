import type { ActorContext } from "@interaction-sdk/core";

export interface NextRequestContext {
  readonly headers: Readonly<Record<string, string>>;
  readonly cookies: Readonly<Record<string, string>>;
}

export type NextActorResolver = (context: NextRequestContext) => ActorContext | Promise<ActorContext>;
