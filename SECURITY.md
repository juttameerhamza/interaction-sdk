# Security model

This SDK treats every host/protocol boundary as untrusted input.

## Non-negotiable rules

- Backend services remain authoritative for authentication, authorization, tenant isolation and business invariants.
- Agent/GenUI output is data, never executable React/HTML/JavaScript.
- Generated UI can render only components registered in the `ComponentCatalog`.
- Generated actions can invoke only actions allowed by the component and are re-checked by the `ActionDispatcher` policy layer.
- Context exposed to agents is explicitly registered and actor-filtered; never serialize the complete runtime/store tree.
- Persisted values are parsed/validated before hydration. Do not persist access or refresh tokens through the generic persistence adapters.
- SDK errors shown to users should be stable domain/error codes; raw backend stack traces and sensitive metadata stay out of UI messages.
- Partner/agent actors should receive least-privilege permissions and catalogs.
- Sensitive, destructive and financial capabilities should opt into explicit confirmation policies and server-side idempotency.

## GenUI trust boundary

```text
Agent payload
  -> protocol parser
  -> UiNode schema
  -> actor-scoped component catalog
  -> prop schema
  -> component action allow-list
  -> actor permission check
  -> renderer registry
  -> ActionDispatcher on interaction
  -> policy / confirmation / backend authorization
```

There is intentionally no fallback that executes arbitrary HTML, script, callback source, or unknown components.

## Reporting

For a real organization deployment, replace this section with the organization's private security reporting channel before publishing externally.
