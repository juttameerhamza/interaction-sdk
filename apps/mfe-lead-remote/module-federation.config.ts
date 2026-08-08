import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "lead_remote",
  filename: "remoteEntry.js",
  exposes: { "./LeadWidget": "./src/LeadWidget.tsx" },
  shared: {
    react: { singleton: true }, "react/": { singleton: true }, "react-dom": { singleton: true },
    "@tanstack/react-query": { singleton: true }, zustand: { singleton: true }, "@interaction-sdk/core": { singleton: true }, "@interaction-sdk/react": { singleton: true },
  },
});
