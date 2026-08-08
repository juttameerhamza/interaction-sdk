"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
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
  return useMemo(() => {
    const browser = createBrowserPlatform();
    return {
      ...browser,
      name: "next-client",
      navigation,
    };
  }, [navigation]);
}
