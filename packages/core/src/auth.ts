import type { Awaitable } from "./types.js";

export interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  roles?: readonly string[];
}

export interface AuthAdapter {
  getAccessToken(): Awaitable<string | null>;
  refresh?(): Awaitable<void>;
  logout?(): Awaitable<void>;
  getUser?(): Awaitable<AuthUser | null>;
}

export const anonymousAuthAdapter: AuthAdapter = {
  getAccessToken: () => null,
};
