import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "sdk_shell",
  remotes: {
    lead_remote: { type: "module", name: "lead_remote", entry: "http://localhost:4201/remoteEntry.js" },
    draft_remote: { type: "module", name: "draft_remote", entry: "http://localhost:4202/remoteEntry.js" },
  },
  shared: {
    react: { singleton: true, requiredVersion: "^19.0.0", strictVersion: true },
    "react/": { singleton: true, requiredVersion: "^19.0.0", strictVersion: true },
    "react-dom": { singleton: true, requiredVersion: "^19.0.0", strictVersion: true },
    "@tanstack/react-query": { singleton: true, requiredVersion: "^5.80.0", strictVersion: true },
    zustand: { singleton: true, requiredVersion: "^5.0.0", strictVersion: true },
    "@interaction-sdk/core": { singleton: true, requiredVersion: "^0.1.0", strictVersion: true },
  },
});
