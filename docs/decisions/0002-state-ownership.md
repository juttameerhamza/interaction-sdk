# ADR 0002: Explicit state ownership

**Status:** Accepted

- Backend/server state belongs to TanStack Query.
- Client/workflow/draft state belongs to vanilla Zustand stores owned by the runtime `StoreRegistry`.
- Persistence is injected through `PersistenceAdapter`.
- Cross-microfrontend sharing is achieved by passing the same runtime/store instances from the host, not by browser globals.

Server data must not be copied into Zustand merely to make it globally accessible.
