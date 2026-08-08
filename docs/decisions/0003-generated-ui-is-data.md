# ADR 0003: Generated UI is data

**Status:** Accepted

AI/agent generated UI is represented by protocol-neutral declarative `UiNode` data. The runtime validates the tree against an actor-scoped component catalog and renderer registry. Semantic action bindings route through the normal `ActionDispatcher`.

Arbitrary generated React, HTML and JavaScript are outside the trusted production architecture.
