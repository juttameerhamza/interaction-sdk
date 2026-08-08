import fs from "node:fs";
import path from "node:path";

const roots = ["packages/core/src", "features"];
const forbidden = {
  "packages/core/src": ["react", "next", "@tanstack/react-query", "zustand", "axios", "@modelcontextprotocol"],
  "features": ["react", "react-dom", "next", "@tanstack/react-query", "@interaction-sdk/components", "@interaction-sdk/react"],
};

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

let failed = false;
for (const root of roots) {
  for (const file of files(root)) {
    const source = fs.readFileSync(file, "utf8");
    for (const moduleName of forbidden[root] ?? []) {
      const pattern = new RegExp(`from\\s+["']${moduleName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:[\\/"'])`);
      if (pattern.test(source)) {
        console.error(`Boundary violation: ${file} imports ${moduleName}`);
        failed = true;
      }
    }
  }
}
if (failed) process.exit(1);
console.log("Architecture boundaries OK");
