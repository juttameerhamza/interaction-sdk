# Architecture

## Core model

The SDK is intentionally capability-driven rather than component-driven.

```text
Host UI / Agent / MCP / Cognigy / Partner
                  |
             Host Adapter
                  |
         Interaction Runtime
        /         |          \
    KNOW          DO         SHOW
 Context      Capabilities  Components
 Registry       + Actions    Catalog
                  |
            Policy Engine
                  |
             Domain Feature
                  |
             Repository
                  |
               Backend
```

### KNOW — Context Registry
Provides actor-filtered, schema-validated context. Never serialize the entire application/runtime to an agent.

### DO — Capability + Action Registries
Capabilities implement reusable business operations. Actions are actor-facing intentions that add risk, permission, confirmation and idempotency semantics before a capability executes.

### SHOW — Component Catalog
Machine-readable metadata for approved UI components. GenUI and host adapters select only catalogued components and validate props/actions before render.

## Dependency rules

- `packages/core` has no React, Next.js, Axios, Zustand, TanStack Query or protocol dependencies.
- `features/*` contain business/domain behavior and must not import React or host adapters.
- `packages/react` adapts runtime state/capabilities to React and TanStack Query.
- `packages/components` provides smart, headless/controller-backed and pure view APIs.
- `adapters/*` translate host/protocol concepts into stable SDK concepts.
- Protocol packages never become business-domain dependencies.

Run `pnpm check:boundaries` and `pnpm check:deps` in CI to enforce the most important rules.

## State ownership

| State | Owner |
|---|---|
| API/server resources | TanStack Query |
| Draft/workflow/client state | Zustand vanilla stores |
| Persistence | `PersistenceAdapter` |
| Domain facts | Backend + domain models |
| Agent session/stream | Agent transport/session layer |

Do not mirror Query data into Zustand.

## Lead vertical slice

```text
LeadForm
  -> useLeadFormController
  -> TanStack mutation
  -> ActionDispatcher(lead.create)
  -> PolicyEngine
  -> CapabilityRegistry(lead.create)
  -> LeadRepository
  -> ApiClient
  -> Backend
```

The same `lead.create` action is exported as an MCP tool without duplicating business logic.

## GenUI safety pipeline

```text
Generated payload
 -> UiNode schema
 -> Component Catalog lookup
 -> actor visibility
 -> prop schema
 -> action allow-list
 -> ActionDispatcher
 -> policy/confirmation
 -> capability
```

Unknown components do not fall back to arbitrary HTML or generated JavaScript.

## Runtime lifetime

`SdkRuntime` owns a lifecycle registry. Features and adapters register subscriptions/streams/disposables with `runtime.lifecycle`, and the host calls `runtime.dispose()` when it owns the runtime lifetime. React providers do **not** dispose injected runtimes automatically because a runtime may be shared by several microfrontends.

## Discovery is actor-scoped

GenUI/agent discovery follows least privilege. Context is visibility-filtered, components can require actor types and permissions, and `createGenUiManifest()` filters actions through the policy engine then exposes only capabilities reachable from those allowed actions. Discovery is not authorization; the `ActionDispatcher` and backend still enforce execution.
