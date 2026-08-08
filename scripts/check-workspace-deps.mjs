import fs from "node:fs";
import path from "node:path";

const packageRoots = ["packages", "features", "adapters", "apps"];
const manifests = packageRoots.flatMap((root) =>
  fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "package.json"))
    .filter(fs.existsSync),
);

const workspace = new Map();
for (const manifest of manifests) {
  const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
  if (pkg.name) workspace.set(pkg.name, path.dirname(manifest));
}

const importPattern = /(?:from\s+["']|import\s*["'])(@interaction-sdk\/[^"']+)/g;
const violations = [];

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

for (const [packageName, packageDir] of workspace) {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ]);

  for (const file of sourceFiles(packageDir)) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      const dependency = [...workspace.keys()]
        .filter((candidate) => specifier === candidate || specifier.startsWith(`${candidate}/`))
        .sort((a, b) => b.length - a.length)[0];

      if (dependency && dependency !== packageName && !declared.has(dependency)) {
        violations.push(`${file}: ${packageName} imports undeclared workspace dependency ${dependency}`);
      }
    }
  }
}

if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log(`Workspace dependency declarations OK (${workspace.size} packages/apps)`);
