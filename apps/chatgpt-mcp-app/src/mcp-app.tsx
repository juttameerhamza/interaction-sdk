import { App } from "@modelcontextprotocol/ext-apps";
import { createRoot } from "react-dom/client";
import { SdkProvider } from "@interaction-sdk/react";
import { LeadForm } from "@interaction-sdk/components/lead";
import { createDemoRuntime } from "@interaction-sdk/testing";

const app = new App({ name: "Interaction SDK Lead App", version: "0.1.0" });
const runtime = await createDemoRuntime();
createRoot(document.getElementById("root")!).render(<SdkProvider runtime={runtime}><LeadForm campaignId="chatgpt-demo" title="Create a lead from ChatGPT" /></SdkProvider>);
await app.connect();
