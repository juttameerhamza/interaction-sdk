import type { Awaitable } from "./types.js";
import type { SdkError } from "./errors.js";

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  properties?: Readonly<Record<string, unknown>>;
  interactionId?: string;
  traceId?: string;
}

export interface TelemetryAdapter {
  track(event: TelemetryEvent): Awaitable<void>;
  captureError?(error: SdkError, context?: Readonly<Record<string, unknown>>): Awaitable<void>;
}

export const noopTelemetry: TelemetryAdapter = {
  track: () => undefined,
};
