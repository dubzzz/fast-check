import { describe, bench } from 'vitest';
import type { StringConstraints } from '../../../src/fast-check.js';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from '../__test-helpers__/Imports.js';

// The variants below mirror the cases reported by PR#7021 (inlining the string mapping into a
// dedicated arbitrary). They exercise the different unit kinds and length constraints so the
// benchmark can both confirm the expected gains and guard against future regressions.
const variants: { name: string; constraints: StringConstraints }[] = [
  { name: 'default', constraints: {} },
  { name: 'empty', constraints: { minLength: 0, maxLength: 0 } },
  { name: 'maxLength:10', constraints: { maxLength: 10 } },
  { name: 'unit:binary', constraints: { unit: 'binary' } },
  { name: 'unit:binary-ascii,length:50', constraints: { unit: 'binary-ascii', minLength: 50, maxLength: 50 } },
  { name: 'unit:grapheme', constraints: { unit: 'grapheme' } },
  { name: 'unit:grapheme-composite', constraints: { unit: 'grapheme-composite' } },
];

describe('string()', () => {
  // Building the arbitrary is the case with the largest reported gain: the chained
  // `array(...).map(...)` is replaced by a single dedicated arbitrary instance.
  describe('construct', () => {
    bench('current', () => {
      fcCurrent.string();
    });
    bench('main', () => {
      fcMain.string();
    });
  });

  for (const { name, constraints } of variants) {
    describe(`generate (${name})`, () => {
      const current = fcCurrent.string(constraints);
      const main = fcMain.string(constraints);
      bench('current', () => {
        current.generate(mrngCurrent, 3);
      });
      bench('main', () => {
        main.generate(mrngMain, 3);
      });
    });
  }

  // Shrinking goes through the rewritten `shrink`/`mapValue` path. We seed it with a non-trivial
  // string (forced length) and drain the whole stream so we measure the per-shrink `Value` mapping
  // that replaces the generic `MapArbitrary` one.
  describe('shrink', () => {
    const current = fcCurrent.string({ minLength: 50, maxLength: 100 });
    const main = fcMain.string({ minLength: 50, maxLength: 100 });
    const currentSeed = current.generate(mrngCurrent, 3);
    const mainSeed = main.generate(mrngMain, 3);
    bench('current', () => {
      Array.from(current.shrink(currentSeed.value, currentSeed.context));
    });
    bench('main', () => {
      Array.from(main.shrink(mainSeed.value, mainSeed.context));
    });
  });

  // `canShrinkWithoutContext` is the third method specialised by the dedicated arbitrary. It runs
  // the unmapper on the received string, so we feed it a non-trivial value to exercise that path.
  describe('canShrinkWithoutContext', () => {
    const current = fcCurrent.string();
    const main = fcMain.string();
    const value = 'The quick brown fox jumps over the lazy dog';
    bench('current', () => {
      current.canShrinkWithoutContext(value);
    });
    bench('main', () => {
      main.canShrinkWithoutContext(value);
    });
  });
});
