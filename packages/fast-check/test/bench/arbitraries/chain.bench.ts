import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('integer().chain(.)', () => {
  describe('generate', () => {
    const current = fcCurrent.integer().chain((n) => fcCurrent.integer({ min: n }));
    const main = fcMain.integer().chain((n) => fcMain.integer({ min: n }));
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
