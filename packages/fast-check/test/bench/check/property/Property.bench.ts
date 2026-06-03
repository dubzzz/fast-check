import { describe, bench } from 'vitest';
import { fcCurrent, fcMain } from '../../__test-helpers__/Imports.js';

describe('property()', () => {
  describe('assert (always successful, empty predicate)', () => {
    const current = fcCurrent.property(fcCurrent.constant(0), () => {});
    const main = fcMain.property(fcMain.constant(0), () => {});
    bench('current', () => {
      fcCurrent.assert(current);
    });
    bench('main', () => {
      fcMain.assert(main);
    });
  });
});
