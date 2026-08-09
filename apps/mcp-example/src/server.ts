import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createSdkMcpServer } from "@interaction-sdk/adapter-mcp";
import { createDemoRuntime } from "@interaction-sdk/testing";

const runtime = await createDemoRuntime({
  actor: {
    type: "agent",
    id: "mcp-agent",
    tenantId: "demo",
    permissions: ["lead:create", "lead:read"],
  },
});

const server = await createSdkMcpServer(runtime, {
  name: "Interaction SDK MCP Example",
  includeActions: ["lead.create", "lead.get"],
});
await serveStdio(() => server);
