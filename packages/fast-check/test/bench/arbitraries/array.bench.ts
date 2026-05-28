import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('array(integer())', () => {
  describe('generate', () => {
    const current = fcCurrent.array(fcCurrent.integer());
    const main = fcMain.array(fcMain.integer());
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
