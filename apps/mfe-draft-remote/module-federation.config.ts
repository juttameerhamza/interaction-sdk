import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "draft_remote",
  filename: "remoteEntry.js",
  exposes: { "./DraftInspector": "./src/DraftInspector.tsx" },
  shared: {
    react: { singleton: true, requiredVersion: "^19.0.0", strictVersion: true }, "react/": { singleton: true, requiredVersion: "^19.0.0", strictVersion: true }, "react-dom": { singleton: true, requiredVersion: "^19.0.0", strictVersion: true },
    "@tanstack/react-query": { singleton: true, requiredVersion: "^5.80.0", strictVersion: true }, zustand: { singleton: true, requiredVersion: "^5.0.0", strictVersion: true }, "@interaction-sdk/core": { singleton: true, requiredVersion: "^0.1.0", strictVersion: true }, "@interaction-sdk/react": { singleton: true, requiredVersion: "^0.1.0", strictVersion: true },
  },
});
