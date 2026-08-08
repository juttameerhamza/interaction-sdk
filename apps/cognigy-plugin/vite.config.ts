import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: "src/plugin.tsx", name: "InteractionSdkCognigyPlugin", formats: ["iife"], fileName: () => "interaction-sdk.webchat-plugin.js" },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
