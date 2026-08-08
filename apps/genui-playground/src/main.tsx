import { createRoot } from "react-dom/client";
import { LeadForm } from "@interaction-sdk/components/lead";
import { SdkProvider } from "@interaction-sdk/react";
import { createDemoRuntime } from "@interaction-sdk/testing";
import { createGenUiManifest } from "@interaction-sdk/genui";
import { createRendererRegistry, GeneratedUi, type GeneratedComponent } from "@interaction-sdk/genui-react";

const runtime = await createDemoRuntime();
const manifest = await createGenUiManifest(runtime);
console.info("GenUI manifest", manifest);

const GeneratedLeadForm: GeneratedComponent = (props) => <LeadForm campaignId={String(props.campaignId)} {...(props.title ? { title: String(props.title) } : {})} />;
const registry = createRendererRegistry({ LeadForm: GeneratedLeadForm });
const agentGeneratedTree = {
  id: "lead-ui-1",
  component: "LeadForm",
  props: { campaignId: "genui-campaign", title: "Generated from an approved component catalog" },
};

createRoot(document.getElementById("root")!).render(<SdkProvider runtime={runtime}><main><h1>Protocol-neutral GenUI</h1><p>This JSON is validated against the Component Catalog before React sees it.</p><pre>{JSON.stringify(agentGeneratedTree, null, 2)}</pre><GeneratedUi tree={agentGeneratedTree} registry={registry} /></main></SdkProvider>);
