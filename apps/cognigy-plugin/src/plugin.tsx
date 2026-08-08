import { useEffect, useState, type JSX } from "react";
import type { SdkRuntime } from "@interaction-sdk/core";
import { fromCognigyMessage } from "@interaction-sdk/adapter-cognigy";
import { createRendererRegistry, GeneratedUi, type GeneratedComponent } from "@interaction-sdk/genui-react";
import { LeadForm } from "@interaction-sdk/components/lead";
import { SdkProvider } from "@interaction-sdk/react";
import { createDemoRuntime } from "@interaction-sdk/testing";

const GeneratedLeadForm: GeneratedComponent = (props) => <LeadForm campaignId={String(props.campaignId)} {...(props.title ? { title: String(props.title) } : {})} />;
const registry = createRendererRegistry({ LeadForm: GeneratedLeadForm });

function InteractionSdkMessage({ message }: { message: unknown }) {
  const [runtime, setRuntime] = useState<SdkRuntime | null>(null);
  useEffect(() => { void createDemoRuntime().then(setRuntime); }, []);
  const tree = fromCognigyMessage(message);
  if (!tree) return null;
  if (!runtime) return <span>Loading…</span>;
  return <SdkProvider runtime={runtime}><GeneratedUi tree={tree} registry={registry} /></SdkProvider>;
}

type CognigyPluginRegistration = {
  match: string;
  component: (props: { message: unknown }) => JSX.Element | null;
};

declare global {
  interface Window { registerPlugin?: (plugin: CognigyPluginRegistration) => void; }
}

// Cognigy Webchat triggers plugins from message.data._plugin.type. The host-specific
// registration stays in this bundle; the payload is immediately translated into
// our protocol-neutral UiNode before reaching SDK components.
window.registerPlugin?.({ match: "interaction-sdk", component: InteractionSdkMessage });

export { InteractionSdkMessage };
