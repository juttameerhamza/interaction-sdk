import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { QueryClient, dehydrate, type DehydratedState } from "@tanstack/react-query";
import {
  createSdk,
  type AnyFeature,
  type CreateSdkOptions,
  type NavigationAdapter,
  type PlatformAdapter,
  type QueryDefinition,
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

export function createNextQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
      mutations: { retry: 0 },
    },
  });
}

export async function prefetchSdkQuery<TData>(
  queryClient: QueryClient,
  definition: QueryDefinition<TData>,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: definition.key,
    queryFn: ({ signal }) => definition.execute({ signal }),
    ...(definition.staleTime !== undefined ? { staleTime: definition.staleTime } : {}),
  });
}

export function dehydrateSdkQueries(queryClient: QueryClient): DehydratedState {
  return dehydrate(queryClient);
}
