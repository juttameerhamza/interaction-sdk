import type { SdkRuntime } from "./runtime.js";

export interface FeatureInstallContext {
  readonly runtime: SdkRuntime;
}

export interface FeatureDefinition<TId extends string, TApi> {
  readonly id: TId;
  readonly version: string;
  install(context: FeatureInstallContext): TApi | Promise<TApi>;
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
