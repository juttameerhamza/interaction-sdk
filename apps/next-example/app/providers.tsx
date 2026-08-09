"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { SdkRuntime } from "@interaction-sdk/core";
import { createWebStoragePersistenceAdapter } from "@interaction-sdk/core";
import { createDemoRuntime } from "@interaction-sdk/testing";
import { SdkProvider } from "@interaction-sdk/react";
import { getNextBrowserQueryClient } from "@interaction-sdk/adapter-next/client";

export function Providers({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<SdkRuntime | null>(null);
  const [queryClient] = useState(() => getNextBrowserQueryClient());
  useEffect(() => {
    let active = true;
    let owned: SdkRuntime | undefined;
    void createDemoRuntime({ persistence: createWebStoragePersistenceAdapter(sessionStorage) }).then((created) => {
      owned = created;
      if (active) setRuntime(created);
      else void created.dispose();
    });
    return () => { active = false; if (owned) void owned.dispose(); };
  }, []);
  if (!runtime) return <p>Initializing SDK runtime…</p>;
  return <SdkProvider runtime={runtime} queryClient={queryClient}>{children}</SdkProvider>;
}
