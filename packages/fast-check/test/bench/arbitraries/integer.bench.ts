import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('integer()', () => {
  describe('generate', () => {
    const current = fcCurrent.integer();
    const main = fcMain.integer();
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
