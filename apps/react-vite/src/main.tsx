import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createExampleRuntime } from "./runtime";
import { SdkProvider } from "@interaction-sdk/react";
import { LeadForm, LeadFormCompound } from "@interaction-sdk/components/lead";

const runtime = await createExampleRuntime();

function App() {
  return <main style={{ display: "grid", gap: 28 }}>
    <header><h1>React / Vite host</h1><p>Smart component and compound composition share one runtime.</p></header>
    <LeadForm campaignId="react-vite" />
    <section><h2>Composition API</h2><LeadFormCompound.Root campaignId="react-composition"><LeadFormCompound.Error /><LeadFormCompound.Success /><LeadFormCompound.Fields /><div style={{ marginTop: 12 }}><LeadFormCompound.Submit>Continue</LeadFormCompound.Submit></div></LeadFormCompound.Root></section>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><SdkProvider runtime={runtime}><App /></SdkProvider></StrictMode>);
