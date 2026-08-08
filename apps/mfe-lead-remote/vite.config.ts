import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import mfConfig from "./module-federation.config";
export default defineConfig({ server: { origin: "http://localhost:4201", port: 4201 }, base: "http://localhost:4201", plugins: [react(), federation(mfConfig)], build: { target: "chrome89" } });
