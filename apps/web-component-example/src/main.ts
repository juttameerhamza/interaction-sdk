import { defineLeadFormElement } from "@interaction-sdk/adapter-web-component";
import { createWebStoragePersistenceAdapter } from "@interaction-sdk/core";
import { createDemoRuntime } from "@interaction-sdk/testing";
let runtimePromise: ReturnType<typeof createDemoRuntime> | undefined;
defineLeadFormElement({
  createRuntime: () => runtimePromise ??= createDemoRuntime({ persistence: createWebStoragePersistenceAdapter(sessionStorage) }),
});
