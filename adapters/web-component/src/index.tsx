import { createRoot, type Root } from "react-dom/client";
import type { SdkRuntime } from "@interaction-sdk/core";
import { SdkProvider } from "@interaction-sdk/react";
import { LeadForm } from "@interaction-sdk/components/lead";

export type DefineLeadFormElementOptions = {
  tagName?: `${string}-${string}`;
  shadowDom?: boolean;
} & ({ runtime: SdkRuntime; createRuntime?: never } | { runtime?: never; createRuntime(): Promise<SdkRuntime> | SdkRuntime });

export function defineLeadFormElement(options: DefineLeadFormElementOptions): void {
  const tagName = options.tagName ?? "interaction-lead-form";
  if (customElements.get(tagName)) return;

  class LeadFormElement extends HTMLElement {
    #root: Root | undefined;
    #abort = new AbortController();
    #runtimePromise: Promise<SdkRuntime> | undefined;
    #unsubscribe: (() => void) | undefined;
    #mount: HTMLElement | ShadowRoot = options.shadowDom ? this.attachShadow({ mode: "open" }) : this;

    static get observedAttributes() { return ["campaign-id", "title"]; }

    connectedCallback() {
      this.#abort = new AbortController();
      this.#runtimePromise ??= Promise.resolve("runtime" in options ? options.runtime : options.createRuntime());
      void this.render();
    }

    disconnectedCallback() {
      this.#abort.abort();
      this.#root?.unmount();
      this.#root = undefined;
      this.#unsubscribe?.();
      this.#unsubscribe = undefined;
      const runtimePromise = this.#runtimePromise;
      this.#runtimePromise = undefined;
      if (!("runtime" in options)) void runtimePromise?.then((runtime) => runtime.dispose()).catch(() => undefined);
    }

    attributeChangedCallback() {
      if (this.isConnected) void this.render();
    }

    async render() {
      try {
        const runtime = await (this.#runtimePromise ??= Promise.resolve("runtime" in options ? options.runtime : options.createRuntime()));
        if (this.#abort.signal.aborted) return;
        this.#unsubscribe ??= runtime.events.on("sdk.action.completed", (payload) => {
          const detail = payload as { actionType?: string; interactionId?: string };
          if (detail.actionType === "lead.create") this.dispatchEvent(new CustomEvent("interaction-lead-created", { detail, bubbles: true, composed: true }));
        });
        const campaignId = this.getAttribute("campaign-id");
        if (!campaignId) {
          this.#root?.unmount();
          this.#root = undefined;
          this.#mount.textContent = "campaign-id is required";
          return;
        }
        if (!this.#root) this.#root = createRoot(this.#mount);
        const title = this.getAttribute("title") ?? undefined;
        this.#root.render(
          <SdkProvider runtime={runtime}>
            <LeadForm campaignId={campaignId} {...(title ? { title } : {})} />
          </SdkProvider>,
        );
      } catch (error) {
        if (this.#abort.signal.aborted) return;
        this.#mount.textContent = "Unable to initialize lead form";
        this.dispatchEvent(new CustomEvent("interaction-error", { detail: { error }, bubbles: true, composed: true }));
      }
    }
  }

  customElements.define(tagName, LeadFormElement);
}
