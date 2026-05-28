import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('string()', () => {
  describe('generate', () => {
    const current = fcCurrent.string();
    const main = fcMain.string();
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
