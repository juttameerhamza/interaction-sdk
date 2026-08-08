import type { SdkRuntime } from "@interaction-sdk/core";
import { registerApplicationActions } from "./actions.js";
import { registerApplicationCapabilities } from "./capabilities.js";
import {
  ApplicationRepositoryToken,
  HttpApplicationRepository,
  type ApplicationRepository,
} from "./repository.js";

export interface RegisterApplicationFeatureOptions {
  readonly repository?: ApplicationRepository;
}

export function registerApplicationFeature(
  runtime: SdkRuntime,
  options: RegisterApplicationFeatureOptions = {},
): void {
  if (!runtime.dependencies.has(ApplicationRepositoryToken)) {
    runtime.dependencies.provide(
      ApplicationRepositoryToken,
      options.repository ?? new HttpApplicationRepository(runtime.api),
    );
  }
  registerApplicationCapabilities(runtime);
  registerApplicationActions(runtime);
}
