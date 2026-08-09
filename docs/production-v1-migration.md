# Production v1 migration

This document tracks the first breaking hardening slice toward the production-v1 architecture.

## Package consumption

Published packages now expose compiled ESM and declarations from `dist`. Consumers must not import `src` paths. CommonJS is not supported.

## Runtime behavior

- Telemetry, error reporters and notification listeners cannot change action outcomes.
- Actions and capabilities reject execution after runtime disposal with `RUNTIME_DISPOSED`.
- Feature lists are preflighted for duplicate IDs, requirements, conflicts and platform capabilities before installation.
- Runtime manifests include `protocolVersion`; hosts can call `checkCompatibility` before mounting integrations.
- Lifecycle cleanup runs in reverse registration order.

## State and queries

- Protected Query keys must include `createQueryCacheScope(runtime)` and are partitioned by environment, tenant and subject.
- A stable actor ID or runtime `sessionId` is required for actor-scoped persistence.
- Persisted stores expose status, revision, `flush()` and asynchronous `dispose()`. Writes are serialized and edits made during hydration win over restored data.

## Host integrations

- `createSdkMcpServer` is asynchronous because tool discovery evaluates actor policy before exposing tools.
- Web Components accept either an injected `runtime` or an owned `createRuntime` factory. Only owned runtimes are disposed by the element.
- The Next client adapter exports `getNextBrowserQueryClient` for suspense-safe browser ownership.
- Generated UI callers may use `safeValidateUiTree` and configurable validation limits.

The legacy service registry and lead-specific React entry point remain temporarily available in this slice; their package-boundary removal requires coordinated consumer migration.
