"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { SdkRuntime } from "@interaction-sdk/core";
import { createWebStoragePersistenceAdapter } from "@interaction-sdk/core";
import { createDemoRuntime } from "@interaction-sdk/testing";
import { SdkProvider } from "@interaction-sdk/react";

export function Providers({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<SdkRuntime | null>(null);
  useEffect(() => { void createDemoRuntime({ persistence: createWebStoragePersistenceAdapter(sessionStorage) }).then(setRuntime); }, []);
  if (!runtime) return <p>Initializing SDK runtime…</p>;
  return <SdkProvider runtime={runtime}>{children}</SdkProvider>;
}
