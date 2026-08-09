import fs from "node:fs";
import path from "node:path";

const roots = ["packages", "features", "adapters"];
const failures = [];

function targets(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(targets);
}

for (const root of roots) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(root, entry.name);
    const manifestPath = path.join(directory, "package.json");
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (const target of targets(manifest.exports)) {
      if (target.includes("/src/")) failures.push(`${manifest.name}: export points to source (${target})`);
      if (!fs.existsSync(path.join(directory, target))) failures.push(`${manifest.name}: missing built export ${target}`);
    }
    if (!Array.isArray(manifest.files) || !manifest.files.includes("dist")) {
      failures.push(`${manifest.name}: package files must allow-list dist`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Package exports resolve to built dist artifacts");
