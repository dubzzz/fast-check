import fc from 'fast-check';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

/**
 * Connect hooks responsible to clean the spies,
 * before any other test runs
 */
export function declareCleaningHooksForSpies(): void {
  const currentGlobalConfiguration = fc.readConfigureGlobal();
  function clean() {
    vi.restoreAllMocks();
  }
  beforeAll(() => {
    fc.configureGlobal({ ...currentGlobalConfiguration, afterEach: clean });
  });
  afterEach(clean);
  afterAll(() => {
    fc.configureGlobal(currentGlobalConfiguration);
  });
}
