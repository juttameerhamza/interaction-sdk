import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "sdk_shell",
  remotes: {
    lead_remote: { type: "module", name: "lead_remote", entry: "http://localhost:4201/remoteEntry.js" },
    draft_remote: { type: "module", name: "draft_remote", entry: "http://localhost:4202/remoteEntry.js" },
  },
  shared: { react: { singleton: true }, "react/": { singleton: true }, "react-dom": { singleton: true }, "@tanstack/react-query": { singleton: true }, zustand: { singleton: true }, "@interaction-sdk/core": { singleton: true } },
});
