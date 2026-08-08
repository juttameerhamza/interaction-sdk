# Roadmap

## v0.1 reference implementation

- Runtime, lifecycle and actor model
- Error/API/auth/persistence abstractions
- Capability + action + policy pipeline
- Context and component catalogs
- Lead vertical slice
- React/TanStack/Zustand integration
- Smart/view/headless/composition/slot component surfaces
- GenUI-safe internal schema/renderer
- React, Next.js, Web Component, Cognigy, MCP, MCP Apps and MFE examples
- Mock HTTP API and Axios path

## v0.2 hardening

- Package publishing build (ESM + declarations, strict public export maps)
- OpenAPI generated transport DTO layer + DTO/domain mappers
- Contract tests against backend OpenAPI
- Runtime/plugin manifest and compatibility negotiation
- DevTools timeline for actions, queries, events, persistence and generated UI
- OpenTelemetry/Sentry adapters
- Browser + Node integration test matrix
- SSR/hydration example for query prefetching

## v0.3 agent runtime

- Concrete AG-UI transport
- Agent session store with snapshot/delta revision semantics
- Interrupt / human-in-the-loop confirmation flow
- MCP Apps view-to-tool bridge generated from action metadata
- A2UI adapter mapped into the internal `UiNode`/component catalog
- GenUI evaluation suite (unknown components, permission violations, schema failures)

## v1 criteria

- Two or more real organization features implemented end-to-end
- At least one internal portal, one Next.js site and one external/agent host consuming the same capability contracts
- Compatibility/versioning policy proven through one non-breaking feature migration
- Production observability and security review completed
