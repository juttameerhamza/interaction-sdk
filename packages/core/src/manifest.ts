import type { SdkRuntime } from "./runtime.js";

export interface FeatureManifestEntry {
  readonly id: string;
  readonly version: string;
}

export interface CapabilityManifestEntry {
  readonly name: string;
  readonly version: number;
}

export interface ActionManifestEntry {
  readonly type: string;
  readonly capability: string;
  readonly risk: string;
  readonly confirmation?: string;
  readonly permissions?: readonly string[];
}

export interface ComponentManifestEntry {
  readonly name: string;
  readonly version: number;
  readonly actions?: readonly string[];
}

export interface SdkManifest {
  readonly protocolVersion: string;
  readonly sdkVersion: string;
  readonly environment: string;
  readonly features: readonly FeatureManifestEntry[];
  readonly capabilities: readonly CapabilityManifestEntry[];
  readonly actions: readonly ActionManifestEntry[];
  readonly components: readonly ComponentManifestEntry[];
}

export function createSdkManifest(
  runtime: SdkRuntime,
  features: readonly FeatureManifestEntry[],
): SdkManifest {
  return {
    protocolVersion: "1.0.0",
    sdkVersion: runtime.config.sdkVersion ?? "0.1.0",
    environment: runtime.config.environment,
    features: [...features],
    capabilities: runtime.capabilities.list().map(({ name, version }) => ({ name, version })),
    actions: runtime.actions.list().map((action) => ({
      type: action.type,
      capability: action.capability,
      risk: action.risk,
      ...(action.confirmation ? { confirmation: action.confirmation } : {}),
      ...(action.permissions ? { permissions: action.permissions } : {}),
    })),
    components: runtime.components.list(runtime.actor).map((component) => ({
      name: component.name,
      version: component.version,
      ...(component.actions ? { actions: component.actions } : {}),
    })),
  };
}

export interface CompatibilityRequirement {
  readonly protocolVersion: string;
  readonly features?: Readonly<Record<string, string>>;
  readonly capabilities?: Readonly<Record<string, number>>;
}

export interface CompatibilityReport {
  readonly compatible: boolean;
  readonly issues: readonly string[];
}

export function checkCompatibility(manifest: SdkManifest, requirement: CompatibilityRequirement): CompatibilityReport {
  const issues: string[] = [];
  if (manifest.protocolVersion.split(".")[0] !== requirement.protocolVersion.split(".")[0]) {
    issues.push(`Runtime protocol ${manifest.protocolVersion} does not satisfy ${requirement.protocolVersion}`);
  }
  for (const [id, range] of Object.entries(requirement.features ?? {})) {
    const feature = manifest.features.find((entry) => entry.id === id);
    if (!feature || !versionSatisfiesManifest(feature.version, range)) issues.push(`Missing or incompatible feature '${id}' ${range}`);
  }
  for (const [name, version] of Object.entries(requirement.capabilities ?? {})) {
    if (!supportsCapability(manifest, name, version)) issues.push(`Missing capability '${name}' v${version}`);
  }
  return { compatible: issues.length === 0, issues };
}

function versionSatisfiesManifest(version: string, range: string): boolean {
  if (range === "*" || range === version) return true;
  const actualMajor = version.match(/\d+/)?.[0];
  const requiredMajor = range.match(/\d+/)?.[0];
  return (range.startsWith("^") || range.startsWith("~")) && actualMajor === requiredMajor;
}

export function supportsFeature(manifest: SdkManifest, id: string, version?: string): boolean {
  return manifest.features.some((feature) => feature.id === id && (!version || feature.version === version));
}

export function supportsCapability(manifest: SdkManifest, name: string, version?: number): boolean {
  return manifest.capabilities.some((capability) => capability.name === name && (version === undefined || capability.version === version));
}
