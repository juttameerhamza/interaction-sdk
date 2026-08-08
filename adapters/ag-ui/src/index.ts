export type AgentRunStatus = "idle" | "running" | "waiting-for-user" | "completed" | "failed" | "cancelled";

export type AgentEvent =
  | { type: "run.started"; runId: string }
  | { type: "text.delta"; runId: string; delta: string }
  | { type: "tool.started"; runId: string; tool: string; callId: string; input: unknown }
  | { type: "tool.completed"; runId: string; callId: string; output: unknown }
  | { type: "state.snapshot"; runId: string; revision: number; state: unknown }
  | { type: "state.delta"; runId: string; revision: number; patch: readonly unknown[] }
  | { type: "interrupt"; runId: string; interruptId: string; payload: unknown }
  | { type: "run.completed"; runId: string }
  | { type: "run.failed"; runId: string; error: unknown };

export interface AgentRunInput {
  sessionId: string;
  message: string;
  context?: Readonly<Record<string, unknown>>;
}

export interface AgentTransport {
  run(input: AgentRunInput, options?: { signal?: AbortSignal }): AsyncIterable<AgentEvent>;
  cancel(runId: string): Promise<void>;
  resume?(interruptId: string, payload: unknown): Promise<void>;
}

/**
 * Protocol-neutral contract. A concrete AG-UI implementation should translate
 * AG-UI wire events into these stable runtime events instead of leaking the
 * protocol through business components.
 */
export function createAgentSessionId(): string {
  return crypto.randomUUID();
}
