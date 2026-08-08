import { createContext, useContext, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider, type QueryClientConfig } from "@tanstack/react-query";
import type { SdkRuntime } from "@interaction-sdk/core";

const RuntimeContext = createContext<SdkRuntime | null>(null);

export interface SdkProviderProps extends PropsWithChildren {
  runtime: SdkRuntime;
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
}

export function SdkProvider({ runtime, children, queryClient, queryClientConfig }: SdkProviderProps) {
  const [internalClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
    ...queryClientConfig,
  }));

  const client = queryClient ?? internalClient;

  return (
    <RuntimeContext.Provider value={runtime}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </RuntimeContext.Provider>
  );
}

export function useSdkRuntime(): SdkRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error("useSdkRuntime must be used inside <SdkProvider>.");
  return runtime;
}
