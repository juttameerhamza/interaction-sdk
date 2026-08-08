import { defineWorkflow } from "@interaction-sdk/core";
import type { ApplicationStatus } from "./schema.js";

export type ApplicationWorkflowEvent = { type: "SUBMIT" };

export const applicationWorkflow = defineWorkflow<ApplicationStatus, ApplicationWorkflowEvent>({
  id: "application",
  version: 1,
  initial: "draft",
  transition(state, event) {
    if ((state === "draft" || state === "ready") && event.type === "SUBMIT") {
      return { state: "submitted", changed: true };
    }
    return { state, changed: false };
  },
});
