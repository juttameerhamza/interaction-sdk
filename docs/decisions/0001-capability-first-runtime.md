# ADR 0001: Capability-first runtime

**Status:** Accepted

Business operations are modeled as framework-independent capabilities. Actor-facing actions add permission, risk, confirmation and idempotency semantics. React components, MCP tools, Cognigy handlers and future agent protocols adapt to actions rather than owning business logic.

This prevents React, MCP, A2UI, AG-UI or any future host protocol from becoming the business architecture.
