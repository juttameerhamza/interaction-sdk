import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSdk,
  type AnyFeature,
  type CreateSdkOptions,
  type NavigationAdapter,
  type PlatformAdapter,
  type Sdk,
} from "@interaction-sdk/core";
import type { NextActorResolver, NextRequestContext } from "./shared.js";

export async function resolveNextRequestContext(): Promise<NextRequestContext> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  return {
    headers: Object.fromEntries(headerStore.entries()),
    cookies: Object.fromEntries(cookieStore.getAll().map((cookie) => [cookie.name, cookie.value])),
  };
}

export function createNextServerNavigation(): NavigationAdapter {
  return {
    push(path) { redirect(path); },
    replace(path) { redirect(path); },
    external(url) { redirect(url); },
  };
}

export function createNextServerPlatform(): PlatformAdapter {
  return {
    name: "next-server",
    capabilities: {
      server: true,
      browser: false,
      navigation: true,
      persistentStorage: false,
    },
    navigation: createNextServerNavigation(),
  };
}

export interface CreateNextServerSdkOptions<TFeatures extends readonly AnyFeature[]>
  extends Omit<CreateSdkOptions<TFeatures>, "actor" | "platform"> {
  readonly resolveActor: NextActorResolver;
}

export async function createNextServerSdk<const TFeatures extends readonly AnyFeature[]>(
  options: CreateNextServerSdkOptions<TFeatures>,
): Promise<Sdk<TFeatures>> {
  const request = await resolveNextRequestContext();
  const actor = await options.resolveActor(request);
  const { resolveActor: _resolveActor, ...sdkOptions } = options;
  return createSdk({
    ...sdkOptions,
    actor,
    platform: createNextServerPlatform(),
  });
}
