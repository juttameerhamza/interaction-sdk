import type { Awaitable } from "./types.js";
import type { PersistenceAdapter } from "./persistence.js";

export interface NavigationAdapter {
  push(path: string): Awaitable<void>;
  replace(path: string): Awaitable<void>;
  external(url: string): Awaitable<void>;
  back?(): Awaitable<void>;
}

export interface PlatformCapabilities {
  readonly server: boolean;
  readonly browser: boolean;
  readonly navigation: boolean;
  readonly persistentStorage: boolean;
}

export interface PlatformAdapter {
  readonly name: string;
  readonly capabilities: PlatformCapabilities;
  readonly navigation?: NavigationAdapter;
  readonly storage?: Readonly<Record<string, PersistenceAdapter>>;
}

export const neutralPlatform: PlatformAdapter = {
  name: "neutral",
  capabilities: {
    server: false,
    browser: false,
    navigation: false,
    persistentStorage: false,
  },
};
