import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('constantFrom(...)', () => {
  describe('generate', () => {
    const current = fcCurrent.constantFrom('a', 'b', 'c', 'd', 'e');
    const main = fcMain.constantFrom('a', 'b', 'c', 'd', 'e');
    bench('current', () => {
      current.generate(mrngCurrent, 3);
    });
    bench('main', () => {
      main.generate(mrngMain, 3);
    });
  });
});
