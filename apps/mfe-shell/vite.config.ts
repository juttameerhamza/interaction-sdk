import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import mfConfig from "./module-federation.config";
export default defineConfig({ server: { origin: "http://localhost:4200", port: 4200 }, base: "http://localhost:4200", plugins: [react(), federation(mfConfig)], build: { target: "chrome89" } });
