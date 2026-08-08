import type { CreateSdkRuntimeOptions, SdkRuntime } from "./runtime.js";
import { createSdkRuntime } from "./runtime.js";
import type { AnyFeature, FeatureApi } from "./feature.js";
import { installFeature } from "./feature.js";

type FeatureMap<TFeatures extends readonly AnyFeature[]> = {
  [TFeature in TFeatures[number] as TFeature["id"]]: FeatureApi<TFeature>;
};

export type Sdk<TFeatures extends readonly AnyFeature[]> = FeatureMap<TFeatures> & {
  readonly runtime: SdkRuntime;
};

export interface CreateSdkOptions<TFeatures extends readonly AnyFeature[]> extends CreateSdkRuntimeOptions {
  readonly features: TFeatures;
}

export async function createSdk<const TFeatures extends readonly AnyFeature[]>(
  options: CreateSdkOptions<TFeatures>,
): Promise<Sdk<TFeatures>> {
  const { features, ...runtimeOptions } = options;
  const runtime = createSdkRuntime(runtimeOptions);
  const featureApis: Record<string, unknown> = {};

  try {
    for (const feature of features) {
      const installed = await installFeature(runtime, feature);
      if (installed.id in featureApis) {
        throw new Error(`Feature '${installed.id}' is already installed`);
      }
      featureApis[installed.id] = installed.api;
    }
  } catch (error) {
    await runtime.dispose();
    throw error;
  }

  return Object.assign(featureApis, { runtime }) as Sdk<TFeatures>;
}
