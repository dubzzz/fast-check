import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('tuple(integer(), integer())', () => {
  describe('generate', () => {
    const current = fcCurrent.tuple(fcCurrent.integer(), fcCurrent.integer());
    const main = fcMain.tuple(fcMain.integer(), fcMain.integer());
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
