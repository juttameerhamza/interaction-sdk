"use client";

import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import type { NavigationAdapter, PlatformAdapter } from "@interaction-sdk/core";
import { createBrowserPlatform } from "@interaction-sdk/adapter-browser";

export function useNextClientNavigation(): NavigationAdapter {
  const router = useRouter();
  return useMemo(() => ({
    push(path) { router.push(path); },
    replace(path) { router.replace(path); },
    external(url) { window.location.assign(url); },
    back() { router.back(); },
  }), [router]);
}

export function useNextClientPlatform(): PlatformAdapter {
  const navigation = useNextClientNavigation();
  const [browserPlatform, setBrowserPlatform] = useState<PlatformAdapter | null>(null);

  useEffect(() => {
    setBrowserPlatform(createBrowserPlatform());
  }, []);

  return useMemo(() => {
    if (!browserPlatform) {
      return {
        name: "next-client",
        capabilities: {
          server: false,
          browser: false,
          navigation: true,
          persistentStorage: false,
        },
        navigation,
      };
    }

    return {
      ...browserPlatform,
      name: "next-client",
      navigation,
    };
  }, [browserPlatform, navigation]);
}

export function SdkHydrationBoundary({
  state,
  children,
}: PropsWithChildren<{ state: DehydratedState }>) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
