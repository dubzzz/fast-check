import * as fc from 'fast-check';
import { afterEach, beforeAll, vi } from 'vitest';

/**
 * Connect hooks responsible to clean the spies,
 * before any other test runs
 */
export function declareCleaningHooksForSpies(): void {
  function clean() {
    vi.restoreAllMocks();
  }
  beforeAll(() => {
    fc.installGlobalPlugin(fc.afterEach(clean));
  });
  afterEach(clean);
}
