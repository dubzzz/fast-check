import { describe, bench } from 'vitest';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

describe('integer().filter(.)', () => {
  // The filter speed-up only impacts the shrink hot path: shrunk candidates rejected by the
  // refinement have to be skipped. We seed a value (with its context) once and shrink it on
  // each run, fully draining the lazy stream so the iterator cost is actually measured.
  describe('shrink', () => {
    const current = fcCurrent.integer().filter((n) => n % 2 === 0);
    const main = fcMain.integer().filter((n) => n % 2 === 0);
    const seedCurrent = current.generate(mrngCurrent, 3);
    const seedMain = main.generate(mrngMain, 3);
    bench('current', () => {
      const it = current.shrink(seedCurrent.value, seedCurrent.context);
      let r = it.next();
      while (!r.done) {
        r = it.next();
      }
    });
    bench('main', () => {
      const it = main.shrink(seedMain.value, seedMain.context);
      let r = it.next();
      while (!r.done) {
        r = it.next();
      }
    });
  });
});
