# Interaction SDK Architecture — Complete A–Z Engineering Reference

> **Document status:** Architecture reference and implementation handbook  
> **Repository:** `juttameerhamza/interaction-sdk`  
> **Reference branch:** `refactor/final-architecture-foundation`  
> **Reference commit:** `61e4f7aacf484c2b718719547f475d5dc2dff858`  
> **Architecture maturity:** **V1 hardening / validation**  
> **Implementation coverage:** V1 foundation + substantial V1.1/V1.2 compatibility work; V2 agent runtime intentionally incomplete  
> **Primary language:** TypeScript  
> **Primary consumers:** React, Next.js App Router, internal portals/microfrontends, partner web integrations, Web Components, MCP/ChatGPT Apps, Cognigy, and future GenUI/agent runtimes

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals](#3-goals)
4. [Non-Goals](#4-non-goals)
5. [Architectural Principles](#5-architectural-principles)
6. [The Core Model: KNOW / DO / SHOW](#6-the-core-model-know--do--show)
7. [High-Level Architecture](#7-high-level-architecture)
8. [Dependency Direction and Layer Rules](#8-dependency-direction-and-layer-rules)
9. [Repository / Monorepo Structure](#9-repository--monorepo-structure)
10. [Package Responsibilities](#10-package-responsibilities)
11. [Public SDK vs Internal Runtime](#11-public-sdk-vs-internal-runtime)
12. [SdkRuntime](#12-sdkruntime)
13. [Actor Model](#13-actor-model)
14. [Typed Dependency Injection](#14-typed-dependency-injection)
15. [Feature System](#15-feature-system)
16. [Capabilities](#16-capabilities)
17. [Actions](#17-actions)
18. [Action Middleware Pipeline](#18-action-middleware-pipeline)
19. [Policy Engine](#19-policy-engine)
20. [Confirmation Model](#20-confirmation-model)
21. [Errors and Error Normalization](#21-errors-and-error-normalization)
22. [API Client Abstraction](#22-api-client-abstraction)
23. [Axios Adapter](#23-axios-adapter)
24. [Transport Contracts and Domain Mapping](#24-transport-contracts-and-domain-mapping)
25. [OpenAPI Integration Strategy](#25-openapi-integration-strategy)
26. [State Ownership](#26-state-ownership)
27. [TanStack Query Model](#27-tanstack-query-model)
28. [Zustand and Workflow State](#28-zustand-and-workflow-state)
29. [Persistence Architecture](#29-persistence-architecture)
30. [Persistence Migration Rules](#30-persistence-migration-rules)
31. [Event Bus](#31-event-bus)
32. [Lifecycle Ownership](#32-lifecycle-ownership)
33. [Platform Abstraction](#33-platform-abstraction)
34. [Browser Adapter](#34-browser-adapter)
35. [Next.js Adapter](#35-nextjs-adapter)
36. [Next.js SSR and Query Hydration](#36-nextjs-ssr-and-query-hydration)
37. [React Integration](#37-react-integration)
38. [Smart / Headless / View Component Model](#38-smart--headless--view-component-model)
39. [Slots and Composition](#39-slots-and-composition)
40. [UI / Design-System Binding](#40-ui--design-system-binding)
41. [Component Catalog](#41-component-catalog)
42. [Context Registry](#42-context-registry)
43. [Data Classification](#43-data-classification)
44. [GenUI Architecture](#44-genui-architecture)
45. [GenUI React Renderer](#45-genui-react-renderer)
46. [MCP Adapter](#46-mcp-adapter)
47. [ChatGPT / MCP Apps](#47-chatgpt--mcp-apps)
48. [Cognigy Adapter](#48-cognigy-adapter)
49. [Web Component Adapter](#49-web-component-adapter)
50. [Microfrontend Architecture](#50-microfrontend-architecture)
51. [Workflow Abstraction](#51-workflow-abstraction)
52. [Lead Vertical Slice](#52-lead-vertical-slice)
53. [Application Vertical Slice](#53-application-vertical-slice)
54. [Resilience and Retry](#54-resilience-and-retry)
55. [Runtime Manifest and Compatibility](#55-runtime-manifest-and-compatibility)
56. [Security Architecture](#56-security-architecture)
57. [Authentication and Authorization](#57-authentication-and-authorization)
58. [Tenant Isolation](#58-tenant-isolation)
59. [Idempotency](#59-idempotency)
60. [Observability and Tracing](#60-observability-and-tracing)
61. [Testing Architecture](#61-testing-architecture)
62. [TestRuntime / Testing Package](#62-testruntime--testing-package)
63. [CI and Architecture Enforcement](#63-ci-and-architecture-enforcement)
64. [Packaging and Publishing](#64-packaging-and-publishing)
65. [Public vs Internal APIs](#65-public-vs-internal-apis)
66. [Partner Consumption Model](#66-partner-consumption-model)
67. [Naming and Versioning Conventions](#67-naming-and-versioning-conventions)
68. [Performance and Bundle Strategy](#68-performance-and-bundle-strategy)
69. [How to Build a New Feature](#69-how-to-build-a-new-feature)
70. [How to Build a New Host Adapter](#70-how-to-build-a-new-host-adapter)
71. [How to Build a New Smart Component](#71-how-to-build-a-new-smart-component)
72. [Architecture Decision Records](#72-architecture-decision-records)
73. [Architecture Version Roadmap](#73-architecture-version-roadmap)
74. [Current Implementation Status](#74-current-implementation-status)
75. [Known Gaps Before Stable V1](#75-known-gaps-before-stable-v1)
76. [V2 Agent Runtime](#76-v2-agent-runtime)
77. [Recommended Final Topology](#77-recommended-final-topology)
78. [Sequence Diagrams](#78-sequence-diagrams)
79. [Operational Checklists](#79-operational-checklists)
80. [Glossary](#80-glossary)

---

# 1. Executive Summary

The **Interaction SDK** is a reusable business-interaction platform for an organization that needs the same domain capabilities, business rules, state transitions, API integration, and smart UI behavior to work across many hosts.

It is intentionally **not a design system**.

The organization already owns a design system. The Interaction SDK sits above that design system and below host applications.

Its job is to centralize:

- backend API access;
- domain/business logic;
- actor-aware actions and permissions;
- workflow/client state;
- persistence behavior;
- reusable smart component behavior;
- safe component metadata for generated UI;
- host/protocol adaptation;
- errors, tracing, policy, confirmation and lifecycle behavior.

The architecture is built around one central idea:

> **Business capabilities are reusable. React components, MCP tools, Cognigy payloads, Web Components and generated UI are different presentations of the same capabilities.**

The shortest mental model is:

```text
KNOW -> Context Registry
DO   -> Capability Registry + Action Dispatcher
SHOW -> Component Catalog
```

Normal application developers should consume a clean feature API:

```ts
const sdk = await createSdk({
  config,
  actor,
  api,
  features: [
    leadFeature(),
    applicationFeature(),
  ],
});

const lead = await sdk.lead.create(input);
const application = await sdk.application.create({ leadId: lead.id });
await sdk.application.submit(application.id);
```

Protocols and advanced hosts can access the lower-level runtime:

```ts
sdk.runtime.actions
sdk.runtime.capabilities
sdk.runtime.context
sdk.runtime.components
sdk.runtime.events
sdk.runtime.policies
```

This separation is critical:

```text
                    Human-facing SDK API

           sdk.lead.create(...)
           sdk.application.submit(...)
                       |
                       v
                Interaction Runtime
                       |
        +--------------+--------------+
        |              |              |
       KNOW            DO            SHOW
        |              |              |
     Context        Actions +       Component
     Registry      Capabilities      Catalog
                       |
                   Repositories
                       |
                    Backend
```

---

# 2. Problem Statement

Without a shared interaction architecture, each product tends to independently implement:

- API calls;
- request/response DTO handling;
- authentication headers;
- retry behavior;
- error mapping;
- business validation;
- permission checks;
- draft persistence;
- state management;
- form submission behavior;
- redirects/navigation;
- telemetry;
- agent/MCP tools;
- host-specific integration glue.

That creates drift.

For example, `lead.create` might be implemented separately in:

```text
Next.js lead website
React internal portal
Partner embed
Cognigy webchat
MCP server
ChatGPT App
Agent workflow
```

Eventually each one behaves slightly differently.

The Interaction SDK makes `lead.create` one business operation and adapts it outward.

```text
                        lead.create
                            |
               +------------+------------+
               |                         |
           Capability                  Action
               |                         |
          Repository             Policy / Risk / HITL
               |                         |
             API                  Actor-facing intent

                            |
      +-----------+---------+---------+-----------+
      |           |                   |           |
    React       Next.js              MCP       Cognigy
```

---

# 3. Goals

The architecture must support all of the following without duplicating domain logic.

## 3.1 Host support

- React applications;
- Next.js App Router applications;
- internal portals;
- microfrontends;
- partner websites;
- Web Components;
- MCP servers;
- ChatGPT / MCP Apps;
- Cognigy webchat/plugins;
- future GenUI clients;
- future agent runtimes.

## 3.2 Centralization

Centralize:

- API transport configuration;
- domain repositories;
- schemas;
- domain mapping;
- reusable business capabilities;
- actor-facing actions;
- policies;
- error semantics;
- persistence infrastructure;
- context discovery;
- component metadata;
- integration contracts.

## 3.3 Component flexibility

A smart component should support:

1. **Smart wrapper** — batteries-included behavior.
2. **Headless/controller layer** — behavior without prescribed markup.
3. **Pure View** — presentational component with explicit props.
4. **Slots** — targeted replacement of parts of a component.
5. **Composition / compound components** — consumers can assemble structure.

## 3.4 Protocol neutrality

Business features must not know about:

- React;
- Next.js;
- MCP;
- Cognigy;
- AG-UI;
- A2UI;
- ChatGPT-specific objects.

Adapters translate those protocols into stable SDK concepts.

## 3.5 Future agent compatibility

The architecture must be able to add:

- persistent agent sessions;
- AG-UI streaming;
- A2UI translation;
- human-in-the-loop interrupts;
- shared agent/application state;
- resumable workflows;
- GenUI evaluations;

without redesigning the core business features.

---

# 4. Non-Goals

The Interaction SDK is **not**:

- a replacement for the organization design system;
- a backend authorization layer;
- a database;
- a general-purpose state-management framework;
- a React-only component library;
- an MCP-only SDK;
- an agent framework in Architecture V1;
- a mechanism for executing generated JavaScript/HTML;
- a way to mirror all backend state into the browser;
- a global singleton that every application must use.

The backend remains authoritative for:

- authentication validity;
- authorization;
- tenant boundaries;
- financial/business invariants;
- final idempotency guarantees;
- durable source-of-truth data.

---

# 5. Architectural Principles

## 5.1 Capability-first, not component-first

Components consume capabilities.

Capabilities must never consume components.

```text
Correct

UI -> Controller -> Action -> Capability -> Repository -> API

Incorrect

Capability -> React component
Repository -> Zustand store
Domain -> Next router
```

## 5.2 Dependency inversion at host boundaries

Core defines contracts.

Hosts provide implementations.

Examples:

```text
AuthAdapter       <- organization auth
ApiClient         <- Axios adapter
PlatformAdapter   <- Browser / Next
PersistenceAdapter<- localStorage / sessionStorage / memory
TelemetryAdapter  <- OpenTelemetry / Sentry / Datadog
ConfirmationAdapter <- app-specific confirmation UI
```

## 5.3 Server state and client state are different

```text
Server/API state      -> TanStack Query
Client/workflow state -> Zustand vanilla
Durable domain truth  -> Backend
Persistence           -> PersistenceAdapter
```

Do not duplicate Query data into Zustand.

## 5.4 Generated UI is data

Agents return declarative `UiNode` structures.

They do not return arbitrary React code.

## 5.5 Least privilege discovery

A component/action/context being discoverable does not mean every actor can see it.

Discovery is filtered by:

- actor type;
- permissions;
- policies;
- component metadata;
- context classification.

## 5.6 Explicit ownership

The creator of a runtime generally owns its lifetime.

A provider receiving an existing runtime must not silently dispose it.

## 5.7 Stable internal concepts, unstable external protocols

MCP, AG-UI, A2UI, Cognigy, Next.js APIs and host APIs may evolve.

The SDK core should change much more slowly.

---

# 6. The Core Model: KNOW / DO / SHOW

## 6.1 KNOW — Context Registry

The Context Registry answers:

> What information may this actor know right now?

Examples:

- current application summary;
- current tenant;
- user profile subset;
- available offers;
- progress state;
- selected product;
- workflow summary.

Context is:

- explicitly registered;
- schema validated;
- actor filtered;
- permission filtered;
- data classified.

Never serialize the entire SDK/runtime/store tree to an agent.

## 6.2 DO — Capabilities + Actions

Capabilities answer:

> What can the business system do?

Actions answer:

> What may an actor request to do, under which policy/risk/confirmation rules?

Example:

```text
Capability:
application.submit

Action:
application.submit
  permissions: ["application:submit"]
  risk: sensitive-write
  confirmation: required-for-agent
  idempotent: true
```

Capabilities are business operations.
Actions are actor-facing semantics around those operations.

## 6.3 SHOW — Component Catalog

The Component Catalog answers:

> Which trusted UI building blocks can be shown to this actor?

A catalog definition includes information such as:

- name;
- version;
- description;
- prop schema;
- allowed actions;
- slots;
- visible actor types;
- permissions;
- metadata.

GenUI and host adapters use the catalog as an allow-list.

---

# 7. High-Level Architecture

```text
+--------------------------------------------------------------------------------+
|                                   HOSTS                                        |
|                                                                                |
| React | Next.js | Internal Portal | Partner | Web Component | ChatGPT | Cognigy|
+------------------------------------------+-------------------------------------+
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                              HOST / PROTOCOL ADAPTERS                          |
|                                                                                |
| Browser | Next Server | Next Client | MCP | Cognigy | Web Component | AG-UI   |
+------------------------------------------+-------------------------------------+
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                                PUBLIC SDK FACADE                               |
|                                                                                |
| sdk.lead.create() | sdk.application.get() | sdk.application.submit()           |
+------------------------------------------+-------------------------------------+
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                              INTERACTION RUNTIME                               |
|                                                                                |
| Config | Actor | Dependencies | Platform | Lifecycle | Errors | Events          |
|                                                                                |
|     KNOW                       DO                         SHOW                  |
| Context Registry      Action/Capability Runtime      Component Catalog         |
|                             Policy Engine                                      |
+------------------------------------------+-------------------------------------+
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                                  FEATURES                                      |
|                                                                                |
| Lead | Application | Eligibility | Agreements | Offers | ...                   |
+------------------------------------------+-------------------------------------+
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                             REPOSITORY / CONTRACT LAYER                        |
|                                                                                |
| Domain Repository -> Transport Contract -> DTO Mapper -> ApiClient             |
+------------------------------------------+-------------------------------------+
                                           |
                                           v
+--------------------------------------------------------------------------------+
|                                  BACKEND                                       |
+--------------------------------------------------------------------------------+
```

---

# 8. Dependency Direction and Layer Rules

The intended dependency direction is:

```text
apps
 |
 v
adapters / components / react
 |
 v
features
 |
 v
core + contracts
```

More precisely:

```text
UI
 |
 v
Controller / Hook
 |
 v
Feature Public API / Action Dispatcher
 |
 v
Action
 |
 v
Capability
 |
 v
Repository Interface
 |
 v
Transport Contract / Mapper
 |
 v
ApiClient
```

## 8.1 Hard rules

### Core

`packages/core` must not depend on:

- React;
- Next.js;
- Axios;
- Zustand;
- TanStack Query;
- MCP;
- Cognigy;
- AG-UI.

### Features

`features/*` must not import:

- React;
- UI components;
- Next.js;
- host adapters;
- protocol packages.

### Components

Components may depend on:

- React bindings;
- feature contracts/types;
- UI bindings.

Components must not own backend transport logic.

### Adapters

Adapters may depend on:

- core contracts;
- protocol/framework libraries;
- specific feature metadata only when the adapter intentionally exposes a feature-specific surface.

Protocol dependencies should never flow backward into feature/domain packages.

---

# 9. Repository / Monorepo Structure

The current refactor branch contains the following major structure:

```text
interaction-sdk/
├── apps/
│   ├── react-vite/
│   ├── next-example/
│   ├── web-component-example/
│   ├── mcp-example/
│   ├── chatgpt-mcp-app/
│   ├── cognigy-plugin/
│   ├── genui-playground/
│   ├── mfe-shell/
│   ├── mfe-lead-remote/
│   ├── mfe-draft-remote/
│   └── mock-api/
│
├── features/
│   ├── lead/
│   └── application/
│
├── packages/
│   ├── core/
│   ├── contracts/
│   ├── state/
│   ├── react/
│   ├── ui/
│   ├── components/
│   ├── genui/
│   ├── genui-react/
│   ├── testing/
│   └── design-system-demo/
│
├── adapters/
│   ├── axios/
│   ├── browser/
│   ├── next/
│   ├── web-component/
│   ├── mcp/
│   ├── cognigy/
│   └── ag-ui/
│
├── docs/
│   ├── architecture.md
│   ├── runtime-support.md
│   ├── roadmap.md
│   └── decisions/
│
├── scripts/
│   ├── check-boundaries.mjs
│   └── check-workspace-deps.mjs
│
├── .github/workflows/ci.yml
├── SECURITY.md
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json
```

---

# 10. Package Responsibilities

| Package | Responsibility |
|---|---|
| `@interaction-sdk/core` | Framework-independent runtime contracts and orchestration |
| `@interaction-sdk/contracts` | Transport/domain mapper contracts |
| `@interaction-sdk/state` | Declarative persisted vanilla Zustand infrastructure |
| `@interaction-sdk/react` | React provider, TanStack adapters and controllers |
| `@interaction-sdk/ui` | Design-system binding contract |
| `@interaction-sdk/components` | Smart / view / compound components |
| `@interaction-sdk/genui` | Protocol-neutral generated UI schema and validation |
| `@interaction-sdk/genui-react` | React renderer registry for validated GenUI trees |
| `@interaction-sdk/testing` | Demo/test runtime utilities |
| `@interaction-sdk/design-system-demo` | Example implementation of UI bindings; not production architecture |
| `@interaction-sdk/feature-lead` | Lead domain feature |
| `@interaction-sdk/feature-application` | Application domain/workflow feature |
| `@interaction-sdk/adapter-axios` | Axios implementation of `ApiClient` |
| `@interaction-sdk/adapter-browser` | Browser platform, navigation and Web Storage integration |
| `@interaction-sdk/adapter-next` | Next server/client platform integration and query hydration helpers |
| `@interaction-sdk/adapter-web-component` | Custom Element wrapper around smart React components |
| `@interaction-sdk/adapter-mcp` | Actions -> MCP tools |
| `@interaction-sdk/adapter-cognigy` | Cognigy envelope <-> `UiNode` translation |
| `@interaction-sdk/adapter-ag-ui` | Protocol-neutral agent event/transport seam |

---

# 11. Public SDK vs Internal Runtime

This is one of the most important design decisions.

## 11.1 Public developer API

Normal product code should ideally read like this:

```ts
const sdk = await createSdk({
  config: {
    apiUrl: "https://api.example.com",
    environment: "production",
  },
  actor,
  api,
  features: [
    leadFeature(),
    applicationFeature(),
  ],
});

await sdk.lead.create({
  firstName: "Ameer",
  lastName: "Hamza",
  email: "example@example.com",
  campaignId: "campaign-1",
});
```

## 11.2 Internal interaction runtime

Advanced adapters and infrastructure can use:

```ts
sdk.runtime.actions.dispatch(...)
sdk.runtime.capabilities.describe()
sdk.runtime.context.resolveVisible(actor)
sdk.runtime.components.list(actor)
sdk.runtime.events.on(...)
sdk.runtime.policies.use(...)
```

## 11.3 Why both layers exist

The public facade gives excellent DX.

The lower-level runtime gives protocol adapters generic discovery and dispatch.

MCP should not need hard-coded knowledge of every feature API method.

It can inspect:

```text
Action Registry
      |
      v
Capability Registry
      |
      v
Schemas
```

while humans use:

```text
sdk.application.submit(id)
```

---

# 12. SdkRuntime

The runtime is the composition root for one interaction environment.

Current shape:

```ts
interface SdkRuntime {
  readonly config: RuntimeConfig;
  readonly actor: ActorContext;
  readonly api: ApiClient;
  readonly auth: AuthAdapter;
  readonly telemetry: TelemetryAdapter;
  readonly errors: ErrorManager;
  readonly persistence: PersistenceRegistry;
  readonly events: EventBus;
  readonly stores: StoreRegistry;

  /** Legacy compatibility only. */
  readonly services: ServiceRegistry;

  readonly dependencies: Container;
  readonly platform: PlatformAdapter;
  readonly capabilities: CapabilityRegistry;
  readonly policies: PolicyEngine;
  readonly actions: ActionDispatcher;
  readonly confirmations: ConfirmationAdapter;
  readonly context: ContextRegistry;
  readonly components: ComponentCatalog;
  readonly lifecycle: LifecycleRegistry;

  dispose(): Promise<void>;
}
```

## 12.1 Runtime responsibilities

The runtime owns infrastructure composition, not business implementation.

It provides shared services that features register with or consume.

## 12.2 Runtime should remain relatively small

As the architecture matures, avoid continually adding unrelated fields to `SdkRuntime`.

Prefer:

- typed dependencies;
- feature APIs;
- plugins/middleware;
- adapter-owned helpers.

The legacy string `ServiceRegistry` exists only for migration compatibility and should eventually disappear from the stable API.

---

# 13. Actor Model

Current actor types:

```ts
type ActorType =
  | "user"
  | "employee"
  | "partner"
  | "agent"
  | "system";
```

Actor context:

```ts
interface ActorContext {
  type: ActorType;
  id?: string;
  tenantId?: string;
  roles?: readonly string[];
  permissions?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}
```

## 13.1 Actor vs authentication identity

An actor is the SDK's normalized identity/authorization context.

The host may obtain it from:

- an OIDC session;
- a JWT;
- Next.js cookies;
- an employee SSO session;
- a partner token;
- an MCP host session;
- a Cognigy user/session.

The feature does not need to know where it came from.

## 13.2 Actor resolution belongs to the host adapter

For example, Next.js exposes a `NextActorResolver` that receives request cookies/headers and returns `ActorContext`.

```text
Next Request
   |
   +-- headers()
   +-- cookies()
   |
   v
NextActorResolver
   |
   v
ActorContext
   |
   v
request-scoped SDK
```

---

# 14. Typed Dependency Injection

Feature code should not use stringly-typed service lookups.

## 14.1 Token

```ts
interface Token<T> {
  readonly id: symbol;
  readonly name: string;
}
```

Create one with:

```ts
export const LeadRepositoryToken =
  createToken<LeadRepository>("lead.repository");
```

## 14.2 Container

```ts
interface Container {
  provide<T>(token: Token<T>, value: T): void;
  get<T>(token: Token<T>): T;
  has<T>(token: Token<T>): boolean;
}
```

Usage:

```ts
runtime.dependencies.provide(
  LeadRepositoryToken,
  repository,
);

const repository =
  runtime.dependencies.get(LeadRepositoryToken);
```

TypeScript knows the returned type is `LeadRepository`.

## 14.3 Why tokens use symbols

Symbols prevent accidental collisions between packages that happen to use the same human-readable name.

The name remains available for diagnostics.

## 14.4 Legacy ServiceRegistry

`runtime.services` remains temporarily to support older integrations.

During migration, feature registration should bridge existing legacy values into typed tokens rather than silently replacing custom integrations.

Target state:

```text
Legacy string registry -> removed from normal feature code
Typed Token<T>         -> stable internal DI API
```

---

# 15. Feature System

The feature is the primary modularity unit.

```ts
interface FeatureDefinition<TId extends string, TApi> {
  readonly id: TId;
  readonly version: string;
  install(context: FeatureInstallContext):
    TApi | Promise<TApi>;
}
```

Create features with:

```ts
export function leadFeature(options = {}) {
  return defineFeature({
    id: "lead",
    version: "1.0.0",
    async install({ runtime }) {
      await registerLeadFeature(runtime, options);

      return {
        create: ...,
        get: ...,
      };
    },
  });
}
```

`createSdk()` derives the final SDK type from the installed feature tuple.

```ts
const sdk = await createSdk({
  ...,
  features: [
    leadFeature(),
    applicationFeature(),
  ],
});
```

TypeScript can expose:

```ts
sdk.lead
sdk.application
```

without manually declaring a giant global interface.

## 15.1 What a feature may register

A feature can register:

- typed dependencies;
- repositories;
- capabilities;
- actions;
- stores;
- context definitions;
- component definitions;
- lifecycle disposables.

## 15.2 Feature installation must be deterministic

Feature installation should:

- fail on conflicting registrations;
- avoid hidden global state;
- support runtime disposal;
- remain host/protocol independent.

---

# 16. Capabilities

A capability is a reusable business operation.

Conceptually:

```ts
interface Capability<TInput, TOutput> {
  name: string;
  version: number;
  description?: string;
  inputSchema: RuntimeSchema<TInput>;
  outputSchema: RuntimeSchema<TOutput>;

  execute(
    input: TInput,
    context: CapabilityContext,
  ): Promise<TOutput>;
}
```

## 16.1 Capability responsibilities

A capability may:

- validate input through its schema;
- obtain typed domain dependencies;
- call repositories;
- enforce domain-level invariants that belong client-side/shared-side;
- return a validated output.

## 16.2 Capability non-responsibilities

A capability should not:

- render UI;
- import React;
- read `window`;
- use Next.js router APIs;
- emit MCP wire payloads;
- know Cognigy message formats;
- directly manipulate TanStack Query cache;
- directly manipulate component-local state.

## 16.3 Capability naming

Recommended form:

```text
<domain>.<operation>

lead.create
lead.get
application.create
application.get
application.submit
agreement.accept
offer.select
```

## 16.4 Capability schemas

`RuntimeSchema<T>` lets core stay schema-library neutral:

```ts
interface RuntimeSchema<T> {
  parse(input: unknown): T;
  description?: string;
  jsonSchema?: Record<string, unknown>;
  native?: unknown;
}
```

Features currently wrap Zod schemas into this contract.

This is useful because:

- capabilities validate input/output;
- MCP can use native Zod schemas;
- GenUI can use JSON-schema-like metadata;
- transport adapters are not coupled to a single validation library in core.

---

# 17. Actions

An action is an actor-facing intent that routes to a capability.

```ts
interface ActionDefinition {
  type: string;
  capability: string;
  description?: string;
  risk: ActionRisk;
  permissions?: readonly string[];
  confirmation?: ActionConfirmation;
  idempotent?: boolean;
}
```

Current risks:

```ts
type ActionRisk =
  | "read"
  | "write"
  | "sensitive-write"
  | "financial"
  | "destructive";
```

Current confirmation modes:

```ts
type ActionConfirmation =
  | "none"
  | "required"
  | "required-for-agent";
```

## 17.1 Why actions are separate from capabilities

Consider:

```text
Capability: application.submit
```

The same capability might be invoked by:

- a user clicking Submit;
- an employee portal;
- an automated system;
- an AI agent.

Those callers may require different actor policy semantics.

The action layer is where actor-facing semantics live.

## 17.2 Actions are serializable/discoverable

String action IDs are intentionally retained because they are useful for:

- MCP tools;
- GenUI bindings;
- event logs;
- telemetry;
- manifests;
- protocol messages.

Internally, typed handles/tokens should be preferred whenever serialization is not needed.

---

# 18. Action Middleware Pipeline

The Action Dispatcher no longer needs to become a giant procedural function.

Its conceptual pipeline is:

```text
Action Request
    |
    v
Error Boundary
    |
    v
Telemetry / Trace
    |
    v
Policy Evaluation
    |
    v
Confirmation
    |
    v
Custom Middleware
    |
    v
Capability Execute
    |
    v
Output Validation
    |
    v
Action Result
```

Custom middleware can be registered through:

```ts
runtime.actions.use(middleware);
```

Potential organization middleware:

```text
auditLog()
fraudDetection()
partnerPolicy()
correlationContext()
featureFlags()
rateLimitHinting()
experimentation()
```

## 18.1 Middleware rule

Middleware must call `next()` at most once.

The dispatcher guards against middleware re-entry.

## 18.2 In-flight idempotency

For actions marked idempotent, concurrent calls with the same idempotency key can share the same in-flight promise.

This prevents duplicate client-side concurrent execution.

It does **not** replace server-side durable idempotency.

---

# 19. Policy Engine

The policy engine centralizes client/runtime authorization decisions and confirmation escalation.

```ts
interface PolicyContext {
  actor: ActorContext;
  action: ActionDefinition;
  risk: ActionRisk;
}
```

A policy returns:

```ts
interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  confirmation: "none" | "required";
}
```

## 19.1 Built-in permission behavior

Before custom policy evaluation, the runtime checks whether the actor has the action's required permissions.

## 19.2 Confirmation escalation

Policies may increase confirmation requirements.

They should not silently reduce an action's explicit risk/confirmation requirement.

## 19.3 Important security rule

Client/runtime policy is defense-in-depth and UX orchestration.

It is **not authoritative authorization**.

The backend must re-check authorization.

---

# 20. Confirmation Model

A `ConfirmationAdapter` lets the host decide how approval is collected.

Possible implementations:

- modal dialog in React;
- native browser confirm for a demo;
- MCP host confirmation;
- ChatGPT tool approval UI;
- Cognigy confirmation flow.

Architecture V1 confirmation is synchronous in the interaction sense:

```text
Action
  -> policy says confirmation required
  -> confirmation adapter
  -> approve / decline
  -> execute or reject
```

Architecture V2 HITL will be different:

```text
Agent Run
  -> action/tool request
  -> persistent interrupt
  -> pending interaction stored
  -> user responds later
  -> same run resumes
```

Do not confuse the V1 confirmation primitive with full resumable agent HITL.

---

# 21. Errors and Error Normalization

All infrastructure and domain-facing failures should normalize to `SdkError` where practical.

Categories:

```text
network
authentication
authorization
validation
business
conflict
rate-limit
timeout
cancelled
protocol
persistence
unexpected
```

`SdkError` also carries:

- stable `code`;
- `retryable`;
- optional HTTP status;
- optional correlation ID;
- metadata;
- cause.

## 21.1 Error layering

Recommended separation:

```text
Raw transport error
      |
      v
Adapter normalization
      |
      v
SdkError
      |
      +--> retry policy
      +--> telemetry
      +--> event stream
      +--> UI-safe presentation
```

## 21.2 UI messages

Do not display raw backend stack traces.

Use stable codes and curated user-facing messages.

Example:

```text
code: LEAD_EMAIL_ALREADY_EXISTS
category: conflict
```

## 21.3 Cancellation

`AbortError` is normalized to:

```text
code: OPERATION_CANCELLED
category: cancelled
```

Operation cancellation should propagate through:

```text
React Query signal
  -> ActionDispatcher
  -> CapabilityContext
  -> Repository OperationOptions
  -> ApiRequestOptions
  -> Axios
```

---

# 22. API Client Abstraction

Core owns a small protocol-neutral HTTP-like contract:

```ts
interface ApiClient {
  get<T>(path: string, options?: ApiRequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  delete<T>(path: string, options?: ApiRequestOptions): Promise<T>;
}
```

Request options include:

```ts
interface ApiRequestOptions {
  signal?: AbortSignal;
  headers?: Readonly<Record<string, string>>;
  idempotencyKey?: string;
  interactionId?: string;
}
```

## 22.1 Why Axios is hidden

Features must not depend on Axios-specific APIs.

This allows future implementations using:

- `fetch`;
- Axios;
- server-to-server clients;
- generated OpenAPI clients;
- mocked clients;
- native clients.

---

# 23. Axios Adapter

`@interaction-sdk/adapter-axios` implements the core `ApiClient`.

Responsibilities include:

- base URL;
- timeout;
- auth token injection;
- `AbortSignal` propagation;
- idempotency header;
- interaction ID header;
- HTTP error normalization;
- centralized retry policy.

Typical headers:

```text
Authorization: Bearer <token>
Idempotency-Key: <key>
X-Interaction-Id: <id>
```

## 23.1 Retry rules

Retry decisions must respect whether the operation is safe/idempotent.

Never blindly retry arbitrary financial/destructive writes.

---

# 24. Transport Contracts and Domain Mapping

Backend DTOs and SDK domain models are deliberately separate concepts.

Core helper contracts:

```ts
interface TransportContract<TDto> {
  readonly id: string;
  readonly version: string;
  parse(input: unknown): TDto;
}

interface Mapper<TTransport, TDomain> {
  toDomain(value: TTransport): TDomain;
  toTransport?(value: TDomain): TTransport;
}
```

## 24.1 Why this matters

Suppose the backend returns:

```ts
interface LeadDto {
  lead_id: string;
  first_name: string;
  last_name: string;
}
```

The SDK can expose:

```ts
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
}
```

If the backend naming/shape changes, the SDK's stable domain API does not necessarily need to change.

## 24.2 Correct flow

```text
Raw response
   |
   v
TransportContract.parse
   |
   v
Transport DTO
   |
   v
Mapper.toDomain
   |
   v
Domain model
```

Do not expose transport DTOs directly from feature public APIs unless they are intentionally the domain contract.

---

# 25. OpenAPI Integration Strategy

The final production flow should be:

```text
Backend OpenAPI
      |
      v
Generated DTOs / generated client
      |
      v
Transport contract validation
      |
      v
Repository
      |
      v
DTO -> Domain mapper
      |
      v
Capability
```

## 25.1 Generated code must stay at the edge

Do not allow generated OpenAPI types to spread throughout components and business code.

Recommended isolation:

```text
features/lead/
  transport/
    generated/
    contract.ts
    mapper.ts
  repository.ts
  domain.ts
```

## 25.2 Contract tests

CI should validate that the generated/declared transport assumptions still match the backend OpenAPI document.

---

# 26. State Ownership

State has explicit owners.

| State type | Owner |
|---|---|
| Backend resources | Backend + TanStack Query cache |
| UI-local ephemeral state | React component |
| Feature draft/workflow state | Zustand vanilla store |
| Persisted client draft | PersistenceAdapter + persisted store definition |
| Authentication state | Host auth system / AuthAdapter |
| Agent stream state | Future AgentSession layer |
| Cross-device durable workflow | Backend, not local Zustand |

## 26.1 Never mirror Query data into Zustand

Bad:

```text
API -> Query -> copy lead into Zustand -> UI
```

Good:

```text
API resource -> Query
Draft edits   -> Zustand
```

Different tools solve different state problems.

---

# 27. TanStack Query Model

TanStack Query is the owner of server state in React-capable hosts.

The architecture introduces a framework-neutral query description:

```ts
interface QueryDefinition<TData> {
  key: readonly unknown[];
  execute(options: { signal?: AbortSignal }): Promise<TData>;
  staleTime?: number;
}
```

A feature can define:

```ts
leadDetailQuery(api, id)
```

React translates it with:

```ts
toQueryOptions(definition)
```

Next server code can use the same definition through:

```ts
prefetchSdkQuery(queryClient, definition)
```

This avoids maintaining separate query semantics for React and Next SSR.

---

# 28. Zustand and Workflow State

Zustand vanilla stores are used for feature/client state because they:

- are framework-independent;
- can be consumed from React;
- can be shared between microfrontends when the runtime owns the store;
- can be persisted through SDK infrastructure;
- do not require React Context as the actual storage mechanism.

A feature store should model only client/workflow state.

Example:

```text
Lead draft:
- firstName
- lastName
- email
- phone
- hydrated flag
- update/reset methods
```

Do not put a canonical server-side Lead record in this draft store.

---

# 29. Persistence Architecture

Persistence is adapter-based and asynchronous.

```ts
interface PersistenceAdapter {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}
```

Runtime always has memory persistence.

Browser/platform adapters may provide:

```text
local
session
```

## 29.1 Declarative persisted stores

`@interaction-sdk/state` provides:

```ts
interface PersistedStoreDefinition<TState, TPersisted> {
  id: string;
  version: number;
  storage?: string;
  scope?: "global" | "tenant" | "actor";
  create: StateCreator<TState>;
  schema: RuntimeSchema<TPersisted>;
  select(state: TState): TPersisted;
  merge(persisted: TPersisted, current: TState): TState;
  migrate?(persisted: unknown, fromVersion: number): TPersisted;
  onHydrated?(current: TState): TState;
}
```

Infrastructure handles:

- storage lookup;
- namespacing;
- hydration;
- validation;
- migrations;
- subscriptions;
- reporting persistence errors;
- cleanup.

---

# 30. Persistence Migration Rules

Persisted keys must remain stable across schema versions.

Correct key identity:

```text
interaction-sdk:<namespace>:<store-id>
```

Version belongs inside the envelope:

```json
{
  "version": 2,
  "state": {}
}
```

This is necessary so version 2 can load version 1 data and call:

```ts
migrate(oldState, 1)
```

If the version is embedded in the key:

```text
:v1
:v2
```

then v2 never finds v1 data and migration cannot happen.

## 30.1 Scope namespacing

Current scopes:

```text
global
<tenant>
<tenant>:<actor>
```

Recommended default for personal drafts: `actor`.

## 30.2 Security

Never persist access tokens or refresh tokens through generic SDK persistence.

Avoid PII unless the product explicitly requires it and appropriate data-handling controls exist.

---

# 31. Event Bus

The event bus provides loose coupling for runtime observations.

Typical events:

```text
sdk.action.completed
sdk.action.failed
feature-specific events
```

Events are useful for:

- analytics;
- cross-feature reactions;
- DevTools;
- tracing;
- host integration.

Do not use the event bus as a hidden replacement for explicit business dependencies.

---

# 32. Lifecycle Ownership

The runtime owns a lifecycle registry.

Features/adapters can register:

- subscriptions;
- stream cleanup;
- store disposal;
- socket cleanup;
- abort controllers;
- custom disposables.

Host rule:

> The code that creates/owns a runtime decides when it is disposed.

## 32.1 React provider

A React provider receiving an externally created runtime should not automatically dispose it.

This is essential when multiple microfrontends share one host-owned runtime.

## 32.2 Web Component

A Web Component adapter that creates its own runtime can own and dispose that runtime when disconnected.

---

# 33. Platform Abstraction

Host-specific capabilities are represented by `PlatformAdapter`.

```ts
interface PlatformCapabilities {
  server: boolean;
  browser: boolean;
  navigation: boolean;
  persistentStorage: boolean;
}

interface PlatformAdapter {
  name: string;
  capabilities: PlatformCapabilities;
  navigation?: NavigationAdapter;
  storage?: Readonly<Record<string, PersistenceAdapter>>;
}
```

This prevents host checks such as:

```ts
if (typeof window !== "undefined") { ... }
```

from spreading through feature code.

Potential platforms:

```text
neutral
browser
next-server
next-client
mcp-app
cognigy
future native host
```

---

# 34. Browser Adapter

The browser adapter provides:

- history navigation;
- external navigation;
- `localStorage` persistence;
- `sessionStorage` persistence;
- browser capability metadata.

Browser-specific APIs stay inside the adapter.

A browser platform should never be instantiated during an SSR render where `window` does not exist.

---

# 35. Next.js Adapter

Next.js is not treated as merely "React with routing".

The adapter has separate server and client entry points.

Recommended imports:

```ts
@interaction-sdk/adapter-next/server
@interaction-sdk/adapter-next/client
```

## 35.1 Server responsibilities

The server adapter:

- reads `headers()`;
- reads `cookies()`;
- resolves the actor;
- creates a **request-scoped SDK**;
- supplies server navigation;
- supports Query prefetch/dehydrate.

## 35.2 Client responsibilities

The client adapter:

- uses Next router navigation;
- switches to browser persistence after hydration;
- avoids reading `window` during SSR/prerender;
- provides `SdkHydrationBoundary`.

## 35.3 Runtime scope

Never use a mutable global singleton server runtime containing actor/auth/request state.

Correct:

```text
Request A -> SDK A -> Actor A
Request B -> SDK B -> Actor B
```

Incorrect:

```text
Global SDK
  + request A mutates actor
  + request B reads same runtime
```

---

# 36. Next.js SSR and Query Hydration

Canonical flow:

```text
Server Component
      |
      v
createNextServerSdk()
      |
      v
createNextQueryClient()
      |
      v
leadDetailQuery(sdk.lead, id)
      |
      v
prefetchSdkQuery()
      |
      v
dehydrateSdkQueries()
      |
      v
<SdkHydrationBoundary>
      |
      v
Client smart component
```

Example:

```tsx
export default async function Page() {
  const sdk = await createNextServerSdk({
    ...options,
    features: [leadFeature()],
    resolveActor,
  });

  const queryClient = createNextQueryClient();

  await prefetchSdkQuery(
    queryClient,
    leadDetailQuery(sdk.lead, "lead-123"),
  );

  const state = dehydrateSdkQueries(queryClient);

  return (
    <SdkHydrationBoundary state={state}>
      <LeadClient />
    </SdkHydrationBoundary>
  );
}
```

## 36.1 Server Components do not require Query for every fetch

If data only needs to render server-side, direct feature API calls are valid:

```ts
const lead = await sdk.lead.get(id);
```

Use Query hydration when the client needs the same cached resource interactively.

---

# 37. React Integration

`@interaction-sdk/react` provides:

- `SdkProvider`;
- runtime context access;
- TanStack Query provider integration;
- query-definition conversion;
- feature controllers/hooks.

## 37.1 QueryClient ownership

The provider supports host injection of a `QueryClient`.

This is important for:

- SSR hydration;
- microfrontends;
- host-level caching policy;
- testing.

## 37.2 Provider should not hide runtime ownership

Prefer:

```tsx
<SdkProvider runtime={hostOwnedRuntime} queryClient={hostQueryClient}>
  ...
</SdkProvider>
```

The provider makes the runtime available to React; it does not become the owner of all runtime lifetime decisions.

---

# 38. Smart / Headless / View Component Model

Each important smart component should ideally expose three surfaces.

## 38.1 Smart component

```tsx
<LeadForm campaignId="campaign-1" />
```

Responsibilities:

- obtains the controller;
- handles feature/runtime integration;
- feeds the pure view.

## 38.2 Headless/controller API

```ts
const controller = useLeadFormController({
  campaignId,
});
```

Consumers can build entirely custom markup while reusing behavior.

## 38.3 Pure View

```tsx
<LeadFormView
  values={values}
  onChange={...}
  onSubmit={...}
/>
```

The View should not:

- call backend APIs;
- dispatch actions directly;
- know runtime configuration;
- own persistence;
- know MCP/Next/Cognigy.

---

# 39. Slots and Composition

## 39.1 Slots

Slots replace targeted subparts:

```ts
interface LeadFormSlots {
  Header?: ComponentType<...>;
  SubmitButton?: ComponentType<...>;
  Error?: ComponentType<...>;
  Success?: ComponentType<...>;
}
```

Use slots when the overall component workflow is appropriate but specific presentation pieces differ.

## 39.2 Compound components

For structural composition:

```tsx
<LeadFormCompound.Root campaignId="campaign-1">
  <LeadFormCompound.Error />
  <LeadFormCompound.Fields />
  <LeadFormCompound.Submit>
    Continue
  </LeadFormCompound.Submit>
</LeadFormCompound.Root>
```

Use compound APIs when consumers need more control over ordering/layout.

## 39.3 Rule of thumb

```text
Need simple usage?        -> Smart component
Need custom visual shell? -> Slots
Need custom structure?    -> Compound API
Need total UI control?    -> Controller + View/custom markup
Need presentation only?   -> View
```

---

# 40. UI / Design-System Binding

The Interaction SDK is not a design system.

`@interaction-sdk/ui` provides a binding contract such as:

```ts
interface UiBindings {
  Card: ComponentType<PropsWithChildren>;
  Field: ComponentType<...>;
  Input: ComponentType<...>;
  Button: ComponentType<...>;
  Alert: ComponentType<...>;
}
```

The host/design-system integration provides an implementation:

```ts
const orgBindings = defineUiBindings({
  Card: NovaCard,
  Field: NovaField,
  Input: NovaInput,
  Button: NovaButton,
  Alert: NovaAlert,
});
```

Then:

```tsx
<UiProvider bindings={orgBindings}>
  <SdkProvider runtime={runtime}>
    <LeadForm campaignId="..." />
  </SdkProvider>
</UiProvider>
```

## 40.1 Why a binding contract exists

It prevents the smart component package from hard-coding a demo design system while still allowing an organization-standard visual implementation.

## 40.2 Production preference

For large organizations, a compile-time binding package may be even better:

```text
@org/interaction-components-nova
```

This can improve:

- tree shaking;
- static typing;
- predictable SSR;
- package dependency governance.

The runtime binding layer remains valuable for generic portability and testing.

---

# 41. Component Catalog

The component catalog contains machine-readable component definitions.

Typical definition:

```ts
interface UiComponentDefinition<TProps> {
  name: string;
  version: number;
  description: string;
  propsSchema: RuntimeSchema<TProps>;
  actions?: readonly string[];
  slots?: readonly string[];
  visibleTo?: readonly ActorType[];
  permissions?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}
```

## 41.1 The catalog is not the React renderer registry

Two distinct concepts:

```text
Component Catalog
  -> what is allowed / metadata / schemas

Renderer Registry
  -> how an approved component name renders in a particular host
```

This separation is important for protocol-neutral GenUI.

---

# 42. Context Registry

Context definitions are explicit:

```ts
interface ContextDefinition<T> {
  name: string;
  schema: RuntimeSchema<T>;
  visibility: readonly ActorType[];
  classification?: DataClassification;
  permissions?: readonly string[];
  resolve(actor: ActorContext): Awaitable<T>;
}
```

The registry can:

```text
resolve one context entry
resolve all visible entries
list visible definitions
```

## 42.1 Why explicit context beats serializing app state

An agent should receive:

```json
{
  "application": {
    "id": "app-123",
    "status": "draft"
  }
}
```

not:

```text
window
redux tree
query cache
all Zustand stores
runtime internals
auth token
```

---

# 43. Data Classification

Current classification vocabulary:

```text
public
internal
partner
confidential
sensitive
```

Classification metadata allows future policy/tooling to reason about whether context is appropriate for:

- internal employees;
- partners;
- external agents;
- telemetry;
- logs;
- caching;
- generated UI.

Classification is metadata, not automatically sufficient security enforcement.

Policy/backend controls remain necessary.

---

# 44. GenUI Architecture

The SDK uses a protocol-neutral tree:

```ts
interface UiNode {
  id: string;
  component: string;
  props: Record<string, unknown>;
  actions?: UiActionBinding[];
  children?: UiNode[];
}
```

Action binding:

```ts
interface UiActionBinding {
  event: string;
  action: string;
  input?: unknown;
}
```

Example:

```json
{
  "id": "lead-form-1",
  "component": "LeadForm",
  "props": {
    "campaignId": "campaign-123"
  },
  "actions": [
    {
      "event": "submit",
      "action": "lead.create"
    }
  ]
}
```

## 44.1 Validation pipeline

```text
Agent / protocol payload
        |
        v
UiNode schema validation
        |
        v
Component Catalog lookup
        |
        v
Actor visibility
        |
        v
Component permissions
        |
        v
Prop schema validation
        |
        v
Component action allow-list
        |
        v
Action permission check
        |
        v
Validated UiNode
```

## 44.2 Security invariant

There is no fallback to arbitrary generated:

- JavaScript;
- React source;
- `<script>`;
- unknown HTML callbacks.

---

# 45. GenUI React Renderer

`@interaction-sdk/genui-react` owns a host-specific `RendererRegistry`.

```ts
interface RendererRegistry {
  register(name: string, component: GeneratedComponent): void;
  get(name: string): GeneratedComponent | undefined;
}
```

Rendering sequence:

```text
UiNode
  -> validateUiTree(runtime)
  -> registry.get(component)
  -> React renderer
  -> sdkActions generated from bindings
  -> runtime.actions.dispatch on interaction
```

If an approved catalog component has no registered React renderer, the React layer renders a safe unsupported-component fallback instead of executing unknown code.

---

# 46. MCP Adapter

The MCP adapter exports runtime actions as tools.

Mapping:

```text
lead.create -> lead_create
application.submit -> application_submit
```

Tool metadata derives from action/capability metadata:

- title;
- description;
- input schema;
- read-only hint;
- idempotent hint;
- destructive hint.

Execution:

```text
MCP Tool Call
    |
    v
ActionDispatcher
    |
    v
Policy / confirmation
    |
    v
Capability
    |
    v
Repository
```

The adapter does not reimplement business operations.

## 46.1 Actor semantics

Current adapter executes with agent actor semantics.

Production integration should resolve/merge host identity carefully instead of blindly granting an agent broad permissions.

---

# 47. ChatGPT / MCP Apps

The ChatGPT MCP App example demonstrates two connected concepts:

1. MCP tool/business capability exposure.
2. Embedded UI resource/view.

The intended architecture is:

```text
ChatGPT / MCP host
       |
       +--> Tool call -> SDK Action -> Capability
       |
       +--> Embedded UI -> trusted SDK component/view
```

The App layer should remain an adapter/example package.

Do not add ChatGPT-specific objects to core features.

---

# 48. Cognigy Adapter

The Cognigy adapter converts between Cognigy plugin envelopes and the protocol-neutral `UiNode`.

Conceptually:

```text
Cognigy message
      |
      v
Cognigy adapter
      |
      v
UiNode
      |
      v
GenUI validation / renderer
```

Current plugin type:

```text
interaction-sdk
```

The adapter's job is translation, not business logic.

---

# 49. Web Component Adapter

The Web Component adapter wraps smart React behavior for plain-web/partner consumption.

Example host markup:

```html
<interaction-lead-form
  campaign-id="campaign-123"
  title="Get started">
</interaction-lead-form>
```

Adapter responsibilities:

- create runtime;
- mount React root;
- map attributes to props;
- unmount on disconnect;
- abort pending lifecycle where appropriate;
- dispose a runtime it owns.

## 49.1 Future improvement

A generic component-to-custom-element factory can replace one-off element definitions as more features are exported externally.

---

# 50. Microfrontend Architecture

For same-page MFEs, the recommended model is host-owned shared infrastructure.

```text
                         Shell / Host
                              |
                +-------------+-------------+
                |                           |
           one SdkRuntime             one QueryClient
                |
           StoreRegistry
                |
          +-----+-----+
          |           |
      Remote A     Remote B
```

## 50.1 Rules

The shell owns:

- runtime creation;
- runtime lifetime;
- QueryClient;
- shared feature stores.

Remotes receive these dependencies explicitly.

Avoid hidden globals like:

```ts
window.__SDK_RUNTIME__
```

## 50.2 Module Federation singleton packages

React, React DOM, TanStack Query, Zustand and runtime packages should be configured as shared singletons where necessary to avoid duplicate framework/runtime copies.

## 50.3 What this does not solve

Same-page shared runtime is not distributed state.

It does not automatically synchronize:

- multiple tabs;
- multiple devices;
- iframes/process boundaries;
- server agents.

A future `StateBridge` / shared-state protocol can address those cases explicitly.

---

# 51. Workflow Abstraction

Architecture V1 includes a lightweight protocol-neutral workflow definition seam.

It is not yet a full durable workflow engine.

A workflow definition can describe:

- states;
- events;
- transition logic;
- version.

Use it for deterministic domain/client state transitions where helpful.

Do not turn it into a distributed durable execution engine prematurely.

Durable cross-device/workflow orchestration belongs either in the backend or future V2 `WorkflowRuntime` depending on the use case.

---

# 52. Lead Vertical Slice

Lead is the first gold-standard feature slice.

Feature pieces include:

```text
schema.ts
transport.ts
repository.ts
capabilities.ts
actions.ts
queries.ts
store.ts
catalog.ts
register.ts
feature.ts
```

## 52.1 Lead create flow

```text
LeadForm
   |
   v
useLeadFormController
   |
   v
Action: lead.create
   |
   v
Policy / confirmation
   |
   v
Capability: lead.create
   |
   v
LeadRepositoryToken
   |
   v
LeadRepository
   |
   v
ApiClient
   |
   v
Backend
```

## 52.2 Lead store

Lead draft state is client state.

It can persist independently from the canonical Lead server resource.

## 52.3 Lead query

A protocol-neutral `leadDetailQuery()` can be converted to TanStack options or prefetched in Next server code.

---

# 53. Application Vertical Slice

Application exists to prove the architecture against something more workflow-oriented than simple Lead CRUD.

Public API:

```ts
interface ApplicationApi {
  create(input, options?): Promise<Application>;
  get(id, options?): Promise<Application>;
  submit(id, options?): Promise<Application>;
}
```

Actions/capabilities include:

```text
application.create
application.get
application.submit
```

Application is the beginning of validating:

- multi-step behavior;
- workflow states;
- sensitive writes;
- action policy;
- cross-feature relationships;
- stronger idempotency requirements.

Future expansion can include:

```text
eligibility
identity
agreements
offers
review
submission
```

The architecture should only be considered truly stable after at least two real organization features exercise these boundaries in production-like conditions.

---

# 54. Resilience and Retry

Core exposes a generic `RetryPolicy`.

```ts
interface RetryPolicy {
  decide(context: RetryContext): RetryDecision;
}
```

Default exponential strategy can use:

- maximum attempts;
- base delay;
- maximum delay;
- `SdkError.retryable`;
- idempotent flag.

## 54.1 Retry principle

```text
Retryability = transport condition AND operation safety
```

Examples:

| Operation | Typical policy |
|---|---|
| GET resource | safe to retry |
| idempotent create with server key | may retry |
| plain create without idempotency | avoid automatic retry |
| validation error | never retry |
| 401 | auth-refresh strategy, not blind retry |
| 429 | retry respecting server guidance |
| destructive financial action | no blind retry |

---

# 55. Runtime Manifest and Compatibility

The SDK can expose a runtime manifest containing:

- SDK version;
- environment;
- installed features;
- feature versions;
- capabilities;
- capability versions;
- actions;
- action risk/permissions/confirmation;
- actor-visible components.

Example conceptual output:

```json
{
  "sdkVersion": "0.1.0",
  "environment": "production",
  "features": [
    { "id": "lead", "version": "1.0.0" },
    { "id": "application", "version": "1.0.0" }
  ],
  "capabilities": [
    { "name": "lead.create", "version": 1 },
    { "name": "application.submit", "version": 1 }
  ]
}
```

Helpers currently support exact feature/capability checks.

Future stable releases should add semver-range compatibility negotiation rather than only exact comparison.

---

# 56. Security Architecture

Every host/protocol boundary is treated as untrusted input.

## 56.1 Non-negotiable rules

- backend authorization is authoritative;
- tenant isolation is backend-enforced;
- generated UI is data, not code;
- only catalogued components render;
- only allowed actions bind to components;
- action policy is re-evaluated at dispatch;
- context is explicitly registered and actor-filtered;
- persistence is schema validated;
- tokens are not stored through generic persistence;
- user-visible errors do not expose raw sensitive backend details;
- destructive/financial/sensitive operations use confirmation and idempotency where appropriate.

## 56.2 GenUI trust boundary

```text
Agent payload
   |
   v
Protocol parser
   |
   v
UiNode schema
   |
   v
Actor-scoped catalog
   |
   v
Prop schema
   |
   v
Action allow-list
   |
   v
Permission/policy checks
   |
   v
Trusted renderer
   |
   v
ActionDispatcher
   |
   v
Backend authorization
```

---

# 57. Authentication and Authorization

Authentication is abstracted behind `AuthAdapter`.

Potential implementations:

```text
OIDC/browser session
Next server session
partner API token
internal employee SSO
MCP host identity
Cognigy session identity
```

## 57.1 Auth token injection

Axios can request an access token through the adapter.

Feature code never reads cookies/localStorage to find tokens.

## 57.2 Token refresh

A production organization may implement single-flight token refresh at the auth/transport boundary.

Avoid embedding refresh rules into every repository.

## 57.3 Authorization layers

```text
UI visibility
  -> convenience / least privilege

Action policy
  -> runtime authorization / confirmation

Backend
  -> authoritative authorization
```

All three have different purposes.

---

# 58. Tenant Isolation

Tenant is part of runtime/actor context and persistence namespacing.

However, tenant identity provided by a browser is not trustworthy by itself.

Backend APIs must derive/validate tenant access from authenticated credentials.

Client tenant IDs are useful for:

- scoping SDK behavior;
- persistence namespaces;
- telemetry context;
- selecting host configuration.

They are not sufficient authorization.

---

# 59. Idempotency

Idempotency has multiple layers.

## 59.1 Client in-flight de-duplication

The Action Dispatcher can share an in-flight promise for an idempotent action + idempotency key.

## 59.2 Transport propagation

`Idempotency-Key` is propagated through `ApiRequestOptions` / Axios.

## 59.3 Server authority

Only the backend can guarantee durable idempotency across:

- retries;
- tabs;
- processes;
- devices;
- crashes;
- delayed network responses.

For sensitive actions, the server must store/recognize idempotency keys.

---

# 60. Observability and Tracing

Current architecture contains:

- telemetry adapter;
- action started/completed/failed events;
- interaction IDs;
- correlation-aware errors;
- event bus.

Production target should propagate:

```text
traceId
sessionId
interactionId
actionId
capabilityId
requestId
agentRunId (V2)
```

Canonical trace:

```text
User Interaction
      |
      v
Action
      |
      v
Capability
      |
      v
Repository
      |
      v
HTTP request
      |
      v
Backend trace
```

## 60.1 Future adapters

Recommended:

```text
@interaction-sdk/observability-otel
@interaction-sdk/observability-sentry
```

or equivalent organization-specific bindings.

Do not couple core directly to a vendor SDK.

---

# 61. Testing Architecture

Testing should be layered.

## 61.1 Unit tests

Test:

- schemas;
- mappers;
- capabilities;
- policies;
- workflow transitions;
- retry decisions.

## 61.2 Contract tests

Test:

- transport DTOs;
- repository assumptions;
- OpenAPI compatibility;
- host adapter message schemas.

## 61.3 Runtime integration tests

Test:

- action -> policy -> capability;
- idempotency;
- confirmations;
- persistence hydration/migration;
- lifecycle disposal;
- actor filtering.

## 61.4 React tests

Test:

- controller behavior;
- query/cache interaction;
- smart component states;
- slots;
- pure views.

## 61.5 Next tests

Test:

- request-scoped SDK;
- server actor resolution;
- SSR safety;
- query prefetch/dehydrate/hydrate;
- no `window` access during server rendering.

## 61.6 Adapter tests

MCP:

- action metadata mapping;
- input schema export;
- dispatch behavior.

Cognigy:

- envelope parsing;
- invalid payload rejection.

GenUI:

- unknown component rejection;
- forbidden actions;
- missing permission;
- invalid props;
- recursive child validation.

---

# 62. TestRuntime / Testing Package

`@interaction-sdk/testing` exists to make feature/component tests cheap.

A good test runtime should support:

- memory persistence;
- in-memory repositories;
- predictable actors;
- test confirmations;
- throwing/mock API clients;
- optional telemetry capture.

The test runtime should use the same feature/action/capability contracts as production.

Do not build a separate fake architecture for tests.

---

# 63. CI and Architecture Enforcement

CI should validate more than compilation.

Current repository includes checks for:

```text
architecture boundaries
workspace dependency declarations
typecheck
tests
build
```

Important scripts:

```text
scripts/check-boundaries.mjs
scripts/check-workspace-deps.mjs
```

## 63.1 Desired final CI

```text
install --frozen-lockfile
      |
      +--> boundary check
      +--> workspace dependency check
      +--> lint
      +--> typecheck
      +--> unit tests
      +--> contract tests
      +--> integration tests
      +--> package build
      +--> package export validation
      +--> bundle-size check
```

---

# 64. Packaging and Publishing

This is still a hardening area.

Stable packages should publish built artifacts, not TypeScript source paths.

Target export map:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

Next adapter should expose environment-specific entry points:

```json
{
  "exports": {
    ".": { "...": "..." },
    "./server": { "...": "..." },
    "./client": { "...": "..." }
  }
}
```

## 64.1 Publishing goals

- ESM;
- declarations;
- source maps;
- strict export maps;
- `sideEffects` correctness;
- peer dependency correctness;
- tree-shakable feature imports;
- no accidental internal exports;
- Changesets-driven releases.

---

# 65. Public vs Internal APIs

Not every runtime primitive should become a permanent public contract.

Recommended categories:

## Stable public

```text
createSdk
feature public APIs
component public APIs
host adapter public factories
core contracts intentionally required by integrations
```

## Advanced public

```text
ActionDispatcher
CapabilityRegistry
ComponentCatalog
ContextRegistry
runtime manifest
```

## Internal / compatibility

```text
legacy ServiceRegistry
implementation-specific registry storage
private helper functions
```

Mark experimental APIs before partners begin depending on them.

---

# 66. Partner Consumption Model

Partners should receive the smallest appropriate surface.

Potential package surfaces:

```text
@org/interaction-sdk
@org/interaction-sdk/lead
@org/interaction-components
@org/interaction-components/lead/view
@org/interaction-web-components
```

Partner use cases differ:

## React partner

Can consume React components/headless APIs if dependency governance allows it.

## Framework-agnostic partner

Consume a Custom Element/Web Component.

## API-only partner

Consume typed feature capability APIs without React.

## Agent host

Consume MCP/action schemas rather than UI component implementation packages.

---

# 67. Naming and Versioning Conventions

## 67.1 Feature IDs

```text
lead
application
eligibility
agreements
offers
```

## 67.2 Capability IDs

```text
<feature>.<verb>
```

Examples:

```text
lead.create
lead.get
application.submit
agreement.accept
```

## 67.3 Action IDs

Prefer matching capability names unless the actor intent is genuinely different.

## 67.4 Store IDs

```text
lead.draft
application.draft
```

## 67.5 Context IDs

```text
application.current
user.summary
offers.available
```

## 67.6 Component names

Use stable catalog names:

```text
LeadForm
ApplicationProgress
OfferSelector
```

## 67.7 Version dimensions

Do not confuse:

```text
Architecture version  V1 / V1.1 / V1.2 / V2
Package semver         0.1.x / 1.x
Feature version        lead 1.0.0
Capability version     lead.create@1
Persisted schema       lead.draft version 2
Transport contract     lead.response 2026-01
```

These solve different compatibility problems.

---

# 68. Performance and Bundle Strategy

## 68.1 Keep core dependency-light

Core should stay small and framework-independent.

## 68.2 Isolate expensive protocol dependencies

MCP libraries belong only in the MCP adapter/app.

Next belongs only in the Next adapter.

React belongs in React/component packages.

## 68.3 Tree-shakable entry points

Consumers should be able to import only what they need.

```ts
import { LeadFormView } from "@org/components/lead/view";
```

should not require shipping:

- MCP;
- Cognigy;
- all other features;
- testing utilities.

## 68.4 Avoid duplicate runtimes in MFEs

Module Federation shared/singleton configuration is important for React/Query/Zustand/runtime packages.

---

# 69. How to Build a New Feature

Assume a new `agreement` feature.

## Step 1 — Domain schemas

```text
features/agreement/src/schema.ts
```

Define:

```ts
Agreement
AcceptAgreementInput
GetAgreementInput
```

Wrap them as `RuntimeSchema` where capabilities need generic schema metadata.

## Step 2 — Transport contract

```text
transport.ts
```

Define the actual backend DTO separately.

## Step 3 — Mapper

```ts
const AgreementMapper = defineMapper<AgreementDto, Agreement>({
  toDomain(dto) {
    return ...;
  },
});
```

## Step 4 — Repository interface + token

```ts
interface AgreementRepository {
  get(id: string, options?: OperationOptions): Promise<Agreement>;
  accept(id: string, options?: OperationOptions): Promise<Agreement>;
}

const AgreementRepositoryToken =
  createToken<AgreementRepository>("agreement.repository");
```

## Step 5 — HTTP repository

Transport code lives here.

Capabilities should not know endpoint paths.

## Step 6 — Capabilities

```text
agreement.get
agreement.accept
```

## Step 7 — Actions

Example:

```ts
defineAction({
  type: "agreement.accept",
  capability: "agreement.accept",
  risk: "sensitive-write",
  permissions: ["agreement:accept"],
  confirmation: "required-for-agent",
  idempotent: true,
});
```

## Step 8 — Client/workflow store only if needed

Do not create Zustand just because every feature has one.

## Step 9 — Query definitions

Define protocol-neutral queries for server resources.

## Step 10 — Context/catalog definitions when needed

Only register context/components that should be discoverable.

## Step 11 — Feature public API

```ts
interface AgreementApi {
  get(id: string): Promise<Agreement>;
  accept(id: string): Promise<Agreement>;
}
```

## Step 12 — Install through `defineFeature`

```ts
agreementFeature({ repository })
```

## Step 13 — Tests

At minimum:

- mapper/transport test;
- capability test;
- action permission/confirmation test;
- repository test;
- public feature API integration test.

---

# 70. How to Build a New Host Adapter

A host adapter must translate host concepts into SDK concepts.

Do not add host concepts to features.

## 70.1 Questions an adapter should answer

- How is actor identity resolved?
- Is this server or browser?
- How does navigation work?
- Which persistence mechanisms exist?
- Who owns runtime lifetime?
- How are confirmations shown?
- How is telemetry connected?
- How are actions exposed?
- How is UI rendered?

## 70.2 Adapter skeleton

```text
adapters/<host>/
  package.json
  src/
    server.ts      # if applicable
    client.ts      # if applicable
    shared.ts
    index.ts
```

## 70.3 Dependency rule

Adapter:

```text
host library -> adapter -> SDK core
```

Never:

```text
feature -> host adapter
```

---

# 71. How to Build a New Smart Component

Assume `ApplicationProgress`.

## 71.1 Controller

```ts
useApplicationProgressController(...)
```

Owns:

- queries;
- action invocation;
- derived presentation state.

## 71.2 View

```tsx
<ApplicationProgressView
  status={...}
  steps={...}
/>
```

Pure rendering.

## 71.3 Smart wrapper

```tsx
<ApplicationProgress applicationId="..." />
```

Connects controller -> view.

## 71.4 Slots

Allow replacement of:

- step indicator;
- header;
- status badge;
- error.

## 71.5 Catalog

If GenUI can render it, define a catalog schema and action allow-list.

## 71.6 UI binding

Use `useUi()` / organization component bindings rather than importing the demo design system.

---

# 72. Architecture Decision Records

The repository currently contains foundational ADRs.

## ADR 0001 — Capability-first runtime

Core business reuse centers on capabilities, not React components.

## ADR 0002 — State ownership

Server state, client state and persistence have separate owners.

## ADR 0003 — Generated UI is data

Generated UI uses trusted declarative component data instead of arbitrary executable code.

Future recommended ADRs:

```text
0004 typed token DI
0005 public SDK facade vs runtime
0006 host/platform adapters
0007 transport DTO isolation
0008 Next request-scoped runtime
0009 persistence migration identity
0010 feature/capability version policy
```

---

# 73. Architecture Version Roadmap

Architecture versions are not package semver.

## Architecture V1 — Platform foundation

Scope:

1. runtime;
2. schemas;
3. error framework;
4. API abstraction;
5. repository pattern;
6. auth adapter;
7. persistence abstraction;
8. Zustand store registry;
9. event bus;
10. capability registry;
11. action dispatcher;
12. policy engine;
13. React provider;
14. TanStack integration;
15. Lead vertical slice;
16. smart/headless/view patterns;
17. component catalog;
18. test runtime;
19. playground/Storybook;
20. basic tracing.

The current refactor additionally strengthens V1 with:

- typed DI;
- typed feature APIs;
- platform abstraction;
- Next server/client adapter;
- generic persisted-store infrastructure;
- transport/domain mapping;
- second Application vertical slice;
- runtime manifest;
- retry policy;
- UI binding.

## Architecture V1.1 — Interaction + GenUI foundation

Intended:

- `UiNode`;
- `RendererRegistry`;
- `ContextRegistry`;
- dynamic component catalog;
- action confirmation;
- SDK DevTools;
- Web Components.

Most structural pieces already exist; DevTools/hardening remain.

## Architecture V1.2 — Host/protocol integrations

Intended:

- MCP adapter;
- MCP Apps;
- ChatGPT integration;
- Cognigy adapter.

The repository contains implementations/examples, but they should remain experimental until the V1 core contracts are validated and packaged stably.

## Architecture V2 — Agent runtime

Intended:

- AG-UI;
- A2UI;
- AgentSession;
- SharedState protocol;
- interrupts;
- human-in-the-loop resume;
- workflow runtime;
- GenUI evaluations.

---

# 74. Current Implementation Status

A useful distinction is:

```text
Architecture implementation coverage: ~V1.2-alpha
Architecture maturity/validation:      V1 hardening
Package semver maturity:                pre-1.0
```

Why?

The repository already contains MCP/Cognigy/GenUI/Web Component integrations, but the stable architecture should be judged by production validation, not the presence of folders.

## Current major status

| Area | Status |
|---|---|
| Core runtime | Implemented, still hardening |
| Typed DI | Implemented |
| Feature facade | Implemented |
| Action middleware | Implemented |
| Lead | Implemented |
| Application | Initial vertical slice implemented |
| React | Implemented, some API cleanup remains |
| UI binding | Implemented |
| Browser adapter | Implemented |
| Next adapter | Implemented foundation |
| SSR query helpers | Implemented foundation |
| Persistence framework | Implemented foundation |
| Transport/domain mapping | Implemented foundation |
| GenUI | Implemented foundation |
| Web Components | Implemented feature-specific example |
| MCP | Implemented foundation |
| ChatGPT MCP App | Example implemented |
| Cognigy | Thin adapter/example implemented |
| MFE shared runtime | Example implemented |
| Runtime manifest | Implemented foundation |
| Retry | Implemented foundation |
| DevTools | Not complete |
| Storybook | Not complete |
| Production tracing adapters | Not complete |
| OpenAPI generation | Not complete |
| A2UI | Not complete |
| Persistent AgentSession | Not complete |
| Full AG-UI runtime | Not complete |
| Durable HITL/resume | Not complete |

---

# 75. Known Gaps Before Stable V1

The following should be treated as V1 hardening work, not optional polish.

## 75.1 Packaging

- built `dist` export maps;
- package contract tests;
- frozen lockfile;
- tree-shaking validation;
- publish/canary workflow.

## 75.2 API/transport

- real organization OpenAPI generation;
- generated DTO isolation;
- contract tests;
- complete HTTP error mapping;
- production auth refresh strategy.

## 75.3 Feature proof

- expand Application into a realistic workflow;
- prove cross-feature dependencies;
- prove at least one non-breaking migration.

## 75.4 Next.js

- migrate the example app fully onto the new adapter;
- SSR integration tests;
- server/client boundary enforcement;
- cache ownership documentation.

## 75.5 Components

- Storybook;
- accessibility tests;
- full design-system binding to the organization library;
- additional smart component examples.

## 75.6 Observability

- trace propagation end-to-end;
- OpenTelemetry/Sentry adapter;
- structured audit events;
- DevTools timeline.

## 75.7 Testing

- browser integration tests;
- Next SSR tests;
- persistence migration tests;
- adapter contract tests;
- partner/Web Component E2E.

## 75.8 Compatibility cleanup

- remove/deprecate legacy `ServiceRegistry` from normal usage;
- formal feature/capability compatibility policy;
- semver-range manifest negotiation.

---

# 76. V2 Agent Runtime

V2 should introduce a durable agent-centric runtime instead of merely adding more adapter files.

Recommended conceptual API:

```ts
interface AgentRuntime {
  sessions: AgentSessionManager;
  transports: AgentTransportRegistry;
  context: ContextRegistry;
  capabilities: CapabilityRegistry;
  components: ComponentCatalog;
  actions: ActionDispatcher;
  sharedState: SharedStateManager;
  workflows: WorkflowRuntime;
}
```

Architecture:

```text
                         AgentRuntime
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
     KNOW                     DO                    SHOW
ContextRegistry       CapabilityRegistry     ComponentCatalog
       |                      |                      |
       +----------------------+----------------------+
                              |
                              v
                         AgentSession
                              |
           +------------------+------------------+
           |                  |                  |
           v                  v                  v
      Shared State        Interrupts         GenUI Stream
           |                  |                  |
           +------------------+------------------+
                              |
                              v
                          Transport
                     AG-UI / A2UI / MCP
```

## 76.1 AgentSession

Should contain durable/serializable session concepts such as:

```text
sessionId
current run
conversation/run metadata
revision
pending interrupt
shared state snapshot
```

## 76.2 Shared state

Needs explicit revision semantics:

```text
snapshot revision N
     |
     +--> delta N+1
     +--> delta N+2
```

## 76.3 Interrupts

Full HITL:

```text
Agent run
   |
   v
Tool/action requested
   |
   v
Runtime interrupt
   |
   v
Persist pending interaction
   |
   v
User approves / edits / rejects
   |
   v
Resume same run
```

## 76.4 A2UI

A2UI should be translated into the SDK's trusted component representation, not bypass the Component Catalog.

## 76.5 AG-UI

AG-UI wire events should translate to stable internal `AgentEvent` semantics.

Business features should never import AG-UI protocol types.

---

# 77. Recommended Final Topology

After hardening, the repository can evolve toward:

```text
interaction-sdk/
│
├── packages/
│   ├── core/                # tiny runtime kernel
│   ├── contracts/           # transport/shared contracts
│   ├── state/               # persisted state primitives
│   ├── react/               # React bindings
│   ├── ui/                  # DS binding contract
│   ├── components/          # smart/headless/view components
│   ├── testing/
│   ├── observability/
│   ├── devtools/
│   ├── genui/
│   └── genui-react/
│
├── features/
│   ├── lead/
│   ├── application/
│   ├── eligibility/
│   ├── agreements/
│   └── offers/
│
├── adapters/
│   ├── axios-or-http/
│   ├── browser/
│   ├── next/
│   │   ├── server/
│   │   └── client/
│   ├── web-component/
│   ├── module-federation-or-host-bridge/
│   ├── mcp/
│   ├── cognigy/
│   ├── ag-ui/               # V2
│   └── a2ui/                # V2
│
└── apps/
    ├── react-example/
    ├── next-example/
    ├── storybook/
    ├── partner-example/
    ├── genui-playground/
    ├── mcp-example/
    └── mfe-example/
```

---

# 78. Sequence Diagrams

## 78.1 React Lead Create

```text
User
 |
 | submit
 v
LeadFormView
 |
 v
useLeadFormController
 |
 v
ActionDispatcher: lead.create
 |
 +--> PolicyEngine
 |      |
 |      +--> permission check
 |      +--> confirmation requirement
 |
 v
CapabilityRegistry: lead.create
 |
 v
LeadRepositoryToken
 |
 v
LeadRepository
 |
 v
ApiClient / Axios
 |
 v
Backend
 |
 v
Lead domain model
 |
 v
ActionResult
 |
 +--> Query cache update
 +--> draft reset
 +--> success UI
```

## 78.2 Next Server Render

```text
HTTP Request
    |
    v
Next Server Component
    |
    v
headers() + cookies()
    |
    v
resolveActor()
    |
    v
createNextServerSdk()
    |
    v
request-scoped SDK
    |
    +--> sdk.lead.get(id)
    |
    or
    |
    +--> prefetchSdkQuery()
            |
            v
        dehydrate()
            |
            v
     HydrationBoundary
            |
            v
       Client React
```

## 78.3 GenUI Render

```text
Agent
 |
 | UiNode JSON
 v
UiNodeSchema
 |
 v
ComponentCatalog
 |
 +--> actor visibility
 +--> permissions
 +--> props schema
 +--> allowed actions
 |
 v
ValidatedUiNode
 |
 v
RendererRegistry
 |
 v
Trusted React Component
 |
 | user interaction
 v
ActionDispatcher
```

## 78.4 MCP Tool

```text
MCP Host
  |
  | lead_create(args)
  v
MCP Adapter
  |
  v
ActionDispatcher
  |
  v
Policy / agent confirmation
  |
  v
lead.create capability
  |
  v
repository -> backend
  |
  v
structured tool result
```

## 78.5 Persisted Store Hydration

```text
Feature registration
      |
      v
createPersistedStore
      |
      v
stable scoped key
      |
      v
PersistenceAdapter.get
      |
      v
envelope { version, state }
      |
      +--> same version -> schema.parse
      |
      +--> old version  -> migrate
      |
      v
merge with initial state
      |
      v
onHydrated
      |
      v
subscriptions enabled
```

## 78.6 MFE Shared Runtime

```text
Host Shell
   |
   +--> create one Runtime
   +--> create one QueryClient
   |
   +----------+-----------+
              |           |
              v           v
         Lead Remote   Draft Remote
              |           |
              +-----+-----+
                    |
                    v
             same StoreRegistry
```

---

# 79. Operational Checklists

## 79.1 New feature checklist

- [ ] Domain types are independent of transport DTOs.
- [ ] Runtime schemas validate external data.
- [ ] Repository interface has a typed token.
- [ ] HTTP details are isolated in repository/transport code.
- [ ] Capabilities contain no React/host imports.
- [ ] Actions declare permissions, risk and confirmation.
- [ ] Idempotent writes propagate a server idempotency key.
- [ ] Query definitions are protocol-neutral where useful.
- [ ] Zustand is used only for client/workflow state.
- [ ] Persisted state has schema version + migration plan.
- [ ] Context exposure is explicit/classified.
- [ ] GenUI-renderable components have catalog definitions.
- [ ] Public feature API is ergonomic.
- [ ] Tests cover capability/action/repository behavior.

## 79.2 New adapter checklist

- [ ] No business logic duplicated in adapter.
- [ ] Actor resolution is explicit.
- [ ] Runtime lifetime/ownership is documented.
- [ ] SSR/browser boundaries are safe.
- [ ] Host navigation is behind an adapter.
- [ ] Host persistence is behind an adapter.
- [ ] Protocol payloads are validated.
- [ ] Feature/core packages do not import adapter types.
- [ ] Security assumptions are documented.
- [ ] Contract tests exist.

## 79.3 Production readiness checklist

- [ ] Built package exports point to `dist`.
- [ ] Lockfile committed and frozen installs enabled.
- [ ] OpenAPI contract generation/validation enabled.
- [ ] Production authentication adapter installed.
- [ ] Backend authorization verified.
- [ ] Retry behavior reviewed for every write category.
- [ ] Idempotency reviewed for sensitive operations.
- [ ] Tokens excluded from persistence.
- [ ] PII persistence reviewed.
- [ ] Telemetry redaction reviewed.
- [ ] Trace/correlation IDs flow to backend.
- [ ] Browser + Node + Next integration tests green.
- [ ] Accessibility and Storybook cases covered.
- [ ] Runtime manifest compatibility policy documented.

---

# 80. Glossary

**Action**  
Actor-facing intent that routes to a capability and adds permission/risk/confirmation/idempotency semantics.

**Actor**  
Normalized runtime identity such as user, employee, partner, agent or system.

**Adapter**  
Host/protocol translation layer that converts platform-specific concepts into stable SDK concepts.

**ApiClient**  
Framework-independent HTTP-like transport abstraction.

**Capability**  
Reusable business operation independent of host UI/protocol.

**Component Catalog**  
Actor-aware metadata allow-list describing trusted components and their schemas/actions.

**Context Registry**  
Explicit actor-filtered, schema-validated information made available to integrations/agents.

**Controller / Headless API**  
Behavior surface consumed by custom UI.

**Domain Model**  
Stable SDK business representation, intentionally separate from transport DTO shape.

**Feature**  
Installable domain module exposing a typed public API and registering runtime behavior.

**GenUI**  
Generated/declarative UI model constrained to trusted catalog components.

**Interaction ID**  
Identifier correlating a single user/host interaction through actions and downstream requests.

**Mapper**  
Translator between transport DTOs and domain models.

**Persistence Adapter**  
Asynchronous get/set/remove abstraction over storage.

**Platform Adapter**  
Host capability abstraction for navigation/storage/server/browser semantics.

**Policy Engine**  
Runtime layer deciding whether an actor may request an action and whether confirmation is required.

**QueryDefinition**  
Framework-neutral description of how to fetch/cache a server resource.

**Repository**  
Domain-facing abstraction over backend/data access.

**Renderer Registry**  
Host-specific mapping from trusted component catalog names to actual render implementations.

**Runtime**  
Infrastructure composition root containing registries, adapters and shared interaction services.

**Sdk facade**  
Ergonomic typed feature API exposed to normal application developers.

**Slot**  
Replaceable presentation region inside a smart/view component.

**Transport Contract**  
Schema/version contract for external backend/protocol DTOs.

**UiNode**  
Protocol-neutral declarative representation of approved generated UI.

**View**  
Pure presentational component driven only by explicit props/callbacks.

**Workflow**  
Explicit state-transition definition; in V1 lightweight and local/domain-focused, in V2 potentially durable/agent-resumable.

---

# Closing Architecture Statement

The Interaction SDK should be judged by one question:

> **Can the organization add another real business feature and expose it consistently through React, Next.js, partners and agents without duplicating business logic or weakening security boundaries?**

The intended final dependency chain is:

```text
Host
 |
 v
Adapter
 |
 v
Typed Public Feature API
 |
 v
Action Pipeline
 |
 v
Capability
 |
 v
Typed Dependency
 |
 v
Repository
 |
 v
Transport Contract / Mapper
 |
 v
ApiClient
 |
 v
Backend
```

And the interaction/discovery model remains:

```text
KNOW -> Context Registry
DO   -> Actions + Capabilities
SHOW -> Component Catalog
```

Everything else — React, Next.js, MCP, Cognigy, Web Components, GenUI, AG-UI and future A2UI — is an adapter or presentation around those stable business concepts.

That is the architecture's central invariant.
