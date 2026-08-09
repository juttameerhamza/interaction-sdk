import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { ActionDefinition, Capability, SdkRuntime } from "@interaction-sdk/core";

export interface CreateSdkMcpServerOptions {
  name?: string;
  version?: string;
  includeActions?: readonly string[];
}

function toToolName(action: ActionDefinition): string {
  return action.type.replaceAll(".", "_");
}

function requireZodSchema(capability: Capability): z.ZodType {
  const schema = capability.inputSchema.native;
  if (!(schema instanceof z.ZodType)) {
    throw new Error(`Capability '${capability.name}' must expose a Zod/Standard Schema in inputSchema.native for MCP export.`);
  }
  return schema;
}

export async function createSdkMcpServer(runtime: SdkRuntime, options: CreateSdkMcpServerOptions = {}): Promise<McpServer> {
  const server = new McpServer({
    name: options.name ?? "Interaction SDK",
    version: options.version ?? runtime.config.sdkVersion ?? "0.1.0",
  });
  const include = options.includeActions ? new Set(options.includeActions) : null;
  const agent = { ...runtime.actor, type: "agent" as const };

  for (const action of runtime.actions.list()) {
    if (include && !include.has(action.type)) continue;
    const decision = await runtime.policies.evaluate({ actor: agent, action, risk: action.risk });
    if (!decision.allowed) continue;
    const capability = runtime.capabilities.get(action.capability);
    const inputSchema = requireZodSchema(capability);
    const outputSchema = capability.outputSchema.native instanceof z.ZodType
      ? capability.outputSchema.native
      : undefined;
    server.registerTool(
      toToolName(action),
      {
        title: action.type,
        description: action.description ?? capability.description ?? action.type,
        inputSchema,
        ...(outputSchema ? { outputSchema } : {}),
        annotations: {
          readOnlyHint: action.risk === "read",
          idempotentHint: action.idempotent ?? false,
          destructiveHint: action.risk === "destructive",
          openWorldHint: false,
        },
      },
      async (input) => {
        const result = await runtime.actions.dispatch({ type: action.type, input }, { actor: agent });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.data) }],
          ...(result.data && typeof result.data === "object" && !Array.isArray(result.data)
            ? { structuredContent: result.data as Record<string, unknown> }
            : {}),
        };
      },
    );
  }
  return server;
}
