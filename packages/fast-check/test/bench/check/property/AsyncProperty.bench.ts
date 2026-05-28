import { describe, bench } from 'vitest';
import { fcCurrent, fcMain } from '../../__test-helpers__/Imports.js';

describe('asyncProperty()', () => {
  describe('assert (always successful, empty predicate)', () => {
    const current = fcCurrent.asyncProperty(fcCurrent.constant(0), async () => {});
    const main = fcMain.asyncProperty(fcMain.constant(0), async () => {});
    bench('current', async () => {
      await fcCurrent.assert(current);
    });
    bench('main', async () => {
      await fcMain.assert(main);
    });
  });
});
