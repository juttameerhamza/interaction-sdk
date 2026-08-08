import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "draft_remote",
  filename: "remoteEntry.js",
  exposes: { "./DraftInspector": "./src/DraftInspector.tsx" },
  shared: {
    react: { singleton: true }, "react/": { singleton: true }, "react-dom": { singleton: true },
    "@tanstack/react-query": { singleton: true }, zustand: { singleton: true }, "@interaction-sdk/core": { singleton: true }, "@interaction-sdk/react": { singleton: true },
  },
});
