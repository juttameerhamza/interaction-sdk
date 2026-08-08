import { createRoot, type Root } from "react-dom/client";
import type { SdkRuntime } from "@interaction-sdk/core";
import { SdkProvider } from "@interaction-sdk/react";
import { LeadForm } from "@interaction-sdk/components/lead";

export interface DefineLeadFormElementOptions {
  tagName?: `${string}-${string}`;
  createRuntime(): Promise<SdkRuntime> | SdkRuntime;
}

export function defineLeadFormElement(options: DefineLeadFormElementOptions): void {
  const tagName = options.tagName ?? "interaction-lead-form";
  if (customElements.get(tagName)) return;

  class LeadFormElement extends HTMLElement {
    #root: Root | undefined;
    #abort = new AbortController();
    #runtimePromise: Promise<SdkRuntime> | undefined;

    static get observedAttributes() { return ["campaign-id", "title"]; }

    connectedCallback() {
      this.#abort = new AbortController();
      this.#runtimePromise ??= Promise.resolve(options.createRuntime());
      void this.render();
    }

    disconnectedCallback() {
      this.#abort.abort();
      this.#root?.unmount();
      this.#root = undefined;
      const runtimePromise = this.#runtimePromise;
      this.#runtimePromise = undefined;
      void runtimePromise?.then((runtime) => runtime.dispose()).catch(() => undefined);
    }

    attributeChangedCallback() {
      if (this.isConnected) void this.render();
    }

    async render() {
      const runtime = await (this.#runtimePromise ??= Promise.resolve(options.createRuntime()));
      if (this.#abort.signal.aborted) return;
      const campaignId = this.getAttribute("campaign-id");
      if (!campaignId) {
        this.#root?.unmount();
        this.#root = undefined;
        this.textContent = "campaign-id is required";
        return;
      }
      if (!this.#root) this.#root = createRoot(this);
      const title = this.getAttribute("title") ?? undefined;
      this.#root.render(
        <SdkProvider runtime={runtime}>
          <LeadForm campaignId={campaignId} {...(title ? { title } : {})} />
        </SdkProvider>,
      );
    }
  }

  customElements.define(tagName, LeadFormElement);
}
