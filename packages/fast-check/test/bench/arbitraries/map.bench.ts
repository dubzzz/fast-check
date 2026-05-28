import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('integer().map(.)', () => {
  describe('generate', () => {
    const current = fcCurrent.integer().map((v) => v + 1);
    const main = fcMain.integer().map((v) => v + 1);
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
