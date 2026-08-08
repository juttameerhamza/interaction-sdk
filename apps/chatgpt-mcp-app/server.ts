import fs from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { createDemoRuntime } from "@interaction-sdk/testing";
import * as z from "zod/v4";

export async function createServer(): Promise<McpServer> {
  const runtime = await createDemoRuntime({ actor: { type: "agent", id: "chatgpt", permissions: ["lead:create", "lead:read"] } });
  const server = new McpServer({ name: "Interaction SDK ChatGPT App", version: "0.1.0" });
  const resourceUri = "ui://interaction-sdk/lead-form.html";
  registerAppTool(server, "create_lead", {
    title: "Create Lead",
    description: "Creates a lead and displays the organization's lead UI.",
    inputSchema: {
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.email(),
      phone: z.string().optional(),
      campaignId: z.string().min(1),
    },
    _meta: { ui: { resourceUri } },
  }, async (input) => {
    const result = await runtime.actions.dispatch({ type: "lead.create", input }, { actor: runtime.actor });
    return { content: [{ type: "text", text: JSON.stringify(result.data) }], structuredContent: result.data as Record<string, unknown> };
  });
  registerAppResource(server, resourceUri, resourceUri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
    contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: await fs.readFile(path.join(import.meta.dirname, "dist", "mcp-app.html"), "utf8") }],
  }));
  return server;
}
