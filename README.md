# Interaction SDK

A reference architecture for reusable **business capabilities + smart components** across React, Next.js, partners, ChatGPT/MCP Apps, Cognigy and future GenUI/agent runtimes.

> This is not a design system. Replace `@interaction-sdk/design-system-demo` with your existing organization design system.

## Architectural model

```text
KNOW -> Context Registry
DO   -> Capability + Action Registry
SHOW -> Component Catalog
```

React, MCP, Cognigy, Web Components and GenUI are adapters around that model.

## What is implemented

- Framework-independent `SdkRuntime`
- Actor model and service/store registries
- Normalized `SdkError`
- Auth, API, telemetry and persistence contracts
- Memory/local/session persistence adapters
- Typed event bus
- Capability registry
- Action dispatcher with permissions, policy, confirmation, cancellation and idempotency hooks
- Context registry
- Machine-readable component catalog
- `Lead` feature with Zod schemas, repository, capabilities/actions and persisted Zustand vanilla draft store
- React provider + TanStack Query integration
- Smart `LeadForm`, pure `LeadFormView`, slot API and compound composition API
- Axios API adapter
- Protocol-neutral GenUI schema/validation + React renderer
- Web Component adapter
- MCP v2 action export adapter
- Cognigy message adapter
- AG-UI-ready agent transport contract
- Module Federation example with host-owned shared runtime/query/store instances
- Demo/test runtime with in-memory repository

## Examples

```bash
pnpm install

pnpm --filter @interaction-sdk-example/react-vite dev
pnpm --filter @interaction-sdk-example/next dev
pnpm --filter @interaction-sdk-example/web-component dev
pnpm --filter @interaction-sdk-example/genui dev
pnpm --filter @interaction-sdk-example/mcp dev
pnpm --filter @interaction-sdk-example/chatgpt-mcp-app dev
pnpm --filter @interaction-sdk-example/cognigy-plugin build

# Microfrontends (run in three terminals)
pnpm --filter @interaction-sdk-example/mfe-lead-remote dev
pnpm --filter @interaction-sdk-example/mfe-draft-remote dev
pnpm --filter @interaction-sdk-example/mfe-shell dev
```

See the [complete A–Z architecture and AI-agent implementation handbook](./docs/interaction-sdk-architecture-a-z.md), [runtime support](./docs/runtime-support.md), [architecture summary](./docs/architecture.md), [security model](./SECURITY.md), and [roadmap](./docs/roadmap.md).

### Exercise the real HTTP path

The Vite example defaults to the in-memory test repository. To exercise `Axios -> HttpLeadRepository -> capability -> action` instead:

```bash
# terminal 1
pnpm --filter @interaction-sdk-example/mock-api dev

# terminal 2
VITE_API_URL=http://localhost:4300 pnpm --filter @interaction-sdk-example/react-vite dev
```

On Windows PowerShell use `$env:VITE_API_URL="http://localhost:4300"` before starting the Vite app.

## Production runtime

```ts
import { createSdkRuntime, createWebStoragePersistenceAdapter } from "@interaction-sdk/core";
import { createAxiosApiClient } from "@interaction-sdk/adapter-axios";
import { registerLeadFeature } from "@interaction-sdk/feature-lead";

const auth = {
  getAccessToken: async () => "...",
};

const api = createAxiosApiClient({
  baseUrl: "https://api.example.com",
  auth,
});

const runtime = createSdkRuntime({
  config: {
    apiUrl: "https://api.example.com",
    environment: "production",
    tenantId: "partner-123",
  },
  actor: {
    type: "user",
    id: "user-123",
    permissions: ["lead:create", "lead:read"],
  },
  api,
  auth,
  persistence: {
    local: createWebStoragePersistenceAdapter(localStorage),
    session: createWebStoragePersistenceAdapter(sessionStorage),
  },
});

await registerLeadFeature(runtime, {
  persistence: runtime.persistence.get("session"),
});
```

## React

```tsx
<SdkProvider runtime={runtime}>
  <LeadForm campaignId="campaign-123" />
</SdkProvider>
```

For full UI control, use `LeadFormView`; for behavior with custom UI, use `useLeadFormController`; for composition use `LeadFormCompound`.


## Microfrontend state

`apps/mfe-shell` creates exactly one `SdkRuntime` and one TanStack `QueryClient`, then injects both into two separately federated remotes. `mfe-lead-remote` updates the lead draft while `mfe-draft-remote` subscribes to the exact same vanilla Zustand store from the runtime `StoreRegistry`.

The host owns runtime lifetime; remotes do not create hidden global stores. Module Federation still marks React, React DOM, TanStack Query, Zustand and the SDK runtime packages as singletons to avoid duplicate framework/runtime copies.

## GenUI

Agents do not generate arbitrary React/HTML. They produce declarative `UiNode` objects that must pass catalog, prop, visibility and action validation before rendering.

```json
{
  "id": "lead-1",
  "component": "LeadForm",
  "props": {
    "campaignId": "campaign-123"
  }
}
```

## Repository status

This initial reference implementation was generated without package-registry network access in the execution environment. The dependency-free core was strict-type-checked and behavior-smoke-tested; all workspace manifests, dependency declarations, architecture boundaries, and TypeScript/TSX syntax were also validated locally. Run `pnpm install && pnpm typecheck && pnpm test && pnpm build` in a normal networked development environment to validate third-party integration APIs and produce the lockfile.
