import fc from 'fast-check';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

function cleanQuick() {
  // The quick cleaning function only clean the surface of the mocks.
  // Instead of fully restoring the default behaviour, it just resets any mocked function that could have been started.
  vi.resetAllMocks();
}

function cleanFull() {
  // The full cleaning function is responsible to fully clean the mocks.
  // It will reset them but also but theùm back to their default. For instance, in the case of a spy, the spy will be moved back
  // to its original implementation (ie. no more spy on the module).
  vi.restoreAllMocks();
}

/**
 * Connect hooks responsible to clean the spies,
 * before any other test runs
 */
export function declareCleaningHooksForSpies(): void {
  const currentGlobalConfiguration = fc.readConfigureGlobal();
  beforeAll(() => {
    fc.configureGlobal({ ...currentGlobalConfiguration, afterEach: cleanQuick });
  });
  afterEach(cleanFull);
  afterAll(() => {
    fc.configureGlobal(currentGlobalConfiguration);
  });
}
