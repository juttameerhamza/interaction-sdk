# Runtime support

| Runtime | Example | Integration strategy |
|---|---|---|
| React + Vite | `apps/react-vite` | Native `SdkProvider` + smart/compound components; optional real Axios backend |
| Next.js | `apps/next-example` | Client-injected runtime; core/domain remain server-safe |
| Partner/plain web | `apps/web-component-example` | Custom Element adapter wraps React implementation |
| MCP | `apps/mcp-example` | SDK actions exported as MCP tools |
| ChatGPT / MCP Apps | `apps/chatgpt-mcp-app` | Tool + embedded UI resource; same SDK business action/component |
| Cognigy Webchat | `apps/cognigy-plugin` | `_plugin` payload translated to protocol-neutral `UiNode` |
| GenUI | `apps/genui-playground` | Catalog-constrained declarative UI renderer |
| Microfrontends | `apps/mfe-shell` + two remotes | Shell-owned runtime + QueryClient injected into federated remotes; shared StoreRegistry state |
| AG-UI / agent streaming | `adapters/ag-ui` | Protocol-neutral event/transport contract ready for concrete transport |
| Mock backend | `apps/mock-api` | Dependency-light HTTP API for exercising `Axios -> HttpLeadRepository` |

## Persistence

The runtime always has `memory`. Browser hosts can additionally register `local` and/or `session` with `createWebStoragePersistenceAdapter`.

Persisted feature state is namespaced by tenant, actor, feature and schema version. The lead example validates restored state before applying it.

## Production integration

Replace `@interaction-sdk/testing` with:

1. `createAxiosApiClient()` from `@interaction-sdk/adapter-axios`.
2. Your organization auth adapter.
3. Your telemetry adapter.
4. The existing organization design-system package instead of `@interaction-sdk/design-system-demo`.
5. Real repository registrations where backend contracts require mapping DTOs to domain models.

## Microfrontend demo

Run the three Vite applications together:

```bash
pnpm --filter @interaction-sdk-example/mfe-lead-remote dev
pnpm --filter @interaction-sdk-example/mfe-draft-remote dev
pnpm --filter @interaction-sdk-example/mfe-shell dev
```

The shell runs on `4200`; the remotes expose `remoteEntry.js` on `4201` and `4202`. The remotes receive the host runtime as props instead of resolving state from browser globals.
