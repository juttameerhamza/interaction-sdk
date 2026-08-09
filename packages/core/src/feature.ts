import type { SdkRuntime } from "./runtime.js";

export interface FeatureInstallContext {
  readonly runtime: SdkRuntime;
}

export interface FeatureDefinition<TId extends string, TApi> {
  readonly id: TId;
  readonly version: string;
  readonly requires?: Readonly<Record<string, string>>;
  readonly conflicts?: readonly string[];
  readonly platform?: readonly (keyof SdkRuntime["platform"]["capabilities"])[];
  install(context: FeatureInstallContext): TApi | Promise<TApi>;
}

function major(version: string): string | undefined {
  return version.match(/\d+/)?.[0];
}

export function versionSatisfies(version: string, range: string): boolean {
  if (range === "*" || range === version) return true;
  if (range.startsWith("^") || range.startsWith("~")) return major(version) === major(range);
  return false;
}

export function preflightFeatures(features: readonly AnyFeature[], runtime: SdkRuntime): void {
  const byId = new Map<string, AnyFeature>();
  for (const feature of features) {
    if (byId.has(feature.id)) throw new Error(`Feature '${feature.id}' is declared more than once`);
    byId.set(feature.id, feature);
  }
  for (const feature of features) {
    for (const [requiredId, range] of Object.entries(feature.requires ?? {})) {
      const required = byId.get(requiredId);
      if (!required || !versionSatisfies(required.version, range)) {
        throw new Error(`Feature '${feature.id}' requires '${requiredId}' ${range}`);
      }
    }
    for (const conflict of feature.conflicts ?? []) {
      if (byId.has(conflict)) throw new Error(`Feature '${feature.id}' conflicts with '${conflict}'`);
    }
    for (const capability of feature.platform ?? []) {
      if (!runtime.platform.capabilities[capability]) {
        throw new Error(`Feature '${feature.id}' requires platform capability '${capability}'`);
      }
    }
  }
}

export function defineFeature<const TId extends string, TApi>(
  feature: FeatureDefinition<TId, TApi>,
): FeatureDefinition<TId, TApi> {
  return feature;
}

export type AnyFeature = FeatureDefinition<string, unknown>;
export type FeatureApi<TFeature> = TFeature extends FeatureDefinition<string, infer TApi> ? TApi : never;

export interface InstalledFeature<TId extends string, TApi> {
  readonly id: TId;
  readonly version: string;
  readonly api: TApi;
}

export async function installFeature<TId extends string, TApi>(
  runtime: SdkRuntime,
  feature: FeatureDefinition<TId, TApi>,
): Promise<InstalledFeature<TId, TApi>> {
  return {
    id: feature.id,
    version: feature.version,
    api: await feature.install({ runtime }),
  };
}
