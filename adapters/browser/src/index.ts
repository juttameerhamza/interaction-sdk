import {
  createWebStoragePersistenceAdapter,
  type NavigationAdapter,
  type PlatformAdapter,
} from "@interaction-sdk/core";

export interface BrowserPlatformOptions {
  readonly window?: Window;
  readonly localStorage?: Storage;
  readonly sessionStorage?: Storage;
}

export function createBrowserNavigation(win: Window = window): NavigationAdapter {
  return {
    push(path) { win.history.pushState(null, "", path); win.dispatchEvent(new PopStateEvent("popstate")); },
    replace(path) { win.history.replaceState(null, "", path); win.dispatchEvent(new PopStateEvent("popstate")); },
    external(url) { win.location.assign(url); },
    back() { win.history.back(); },
  };
}

export function createBrowserPlatform(options: BrowserPlatformOptions = {}): PlatformAdapter {
  const win = options.window ?? window;
  const local = options.localStorage ?? win.localStorage;
  const session = options.sessionStorage ?? win.sessionStorage;

  return {
    name: "browser",
    capabilities: {
      server: false,
      browser: true,
      navigation: true,
      persistentStorage: true,
    },
    navigation: createBrowserNavigation(win),
    storage: {
      local: createWebStoragePersistenceAdapter(local),
      session: createWebStoragePersistenceAdapter(session),
    },
  };
}
