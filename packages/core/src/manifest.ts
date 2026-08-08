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

export function supportsFeature(manifest: SdkManifest, id: string, version?: string): boolean {
  return manifest.features.some((feature) => feature.id === id && (!version || feature.version === version));
}

export function supportsCapability(manifest: SdkManifest, name: string, version?: number): boolean {
  return manifest.capabilities.some((capability) => capability.name === name && (version === undefined || capability.version === version));
}
