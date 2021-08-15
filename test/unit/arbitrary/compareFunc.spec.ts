import * as fc from '../../../lib/fast-check';
import { compareFunc } from '../../../src/arbitrary/compareFunc';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { hasCloneMethod, cloneIfNeeded } from '../../../src/check/symbols';
import { hash } from '../../../src/utils/hash';
import { stringify } from '../../../src/utils/stringify';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

describe('compareFunc (integration)', () => {
  const compareFuncBuilder = () => convertToNext(compareFunc());

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(compareFuncBuilder, {
      extraParameters: fc.array(fc.tuple(fc.anything(), fc.anything()), { minLength: 1 }),
      isEqual: (fa, fb, calls) => {
        for (const [a, b] of calls) {
          expect(fb(a, b)).toBe(fa(a, b));
        }
      },
    });
  });

  it('should be transitive', () => {
    assertProduceCorrectValues(
      compareFuncBuilder,
      (f, [a, b, c]) => {
        const ab = f(a, b);
        const bc = f(b, c);
        if (ab < 0 && bc < 0) expect(f(a, c)).toBeLessThan(0);
        else if (ab > 0 && bc > 0) expect(f(a, c)).toBeGreaterThan(0);
        // else: neither handled, nor skipped (yet)
      },
      { extraParameters: fc.tuple(fc.anything(), fc.anything(), fc.anything()) }
    );
  });

  it('should be zero when a = b', () => {
    assertProduceCorrectValues(
      compareFuncBuilder,
      (f, a) => {
        expect(f(a, a)).toBe(0);
      },
      { extraParameters: fc.anything() }
    );
  });

  it('should be consistent when called in reversed order', () => {
    assertProduceCorrectValues(
      compareFuncBuilder,
      (f, [a, b]) => {
        const ab = f(a, b);
        const ba = f(b, a);
        if (ab === 0) expect(ba).toBe(0);
        else if (ab < 0) expect(ba).toBeGreaterThan(0);
        else expect(ba).toBeLessThan(0);
      },
      { extraParameters: fc.tuple(fc.anything(), fc.anything()) }
    );
  });

  it('should give a re-usable string representation of the function', () => {
    assertProduceCorrectValues(
      compareFuncBuilder,
      (f, calls) => {
        let assertionHasBeenExecuted = false;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (function (hash, stringify) {
          assertionHasBeenExecuted = true;
          try {
            // As the output of toString might be different if the function has been called
            // before or after toString, we assess both cases
            const dataFromToStringBefore = eval(
              `(function() { const f = ${f}; return calls.map((args) => f(...args)); })()`
            );
            const data = calls.map(([a, b]) => f(a, b));
            const dataFromToString = eval(`(function() { const f = ${f}; return calls.map((args) => f(...args)); })()`);

            expect(dataFromToStringBefore).toStrictEqual(data);
            expect(dataFromToString).toStrictEqual(data);
          } catch (err) {
            throw new Error(`Invalid toString representation encountered, got: ${f}\n\nFailed with: ${err}`);
          }
        })(hash, stringify);

        expect(assertionHasBeenExecuted).toBe(true);
      },
      { extraParameters: fc.array(fc.tuple(fc.anything(), fc.anything())) }
    );
  });

  it('should produce cloneable instances with independant histories', () => {
    assertProduceCorrectValues(
      compareFuncBuilder,
      (f, calls) => {
        for (const [a, b] of calls) {
          f(a, b);
        }
        expect(String(f)).toBe(String(f)); // calling toString does not alter the output
        expect(hasCloneMethod(f)).toBe(true); // f should be cloneable
        const clonedF = cloneIfNeeded(f);
        expect(String(clonedF)).not.toBe(String(f)); // f has been called with inputs, clonedF has not yet!
        for (const [a, b] of calls) {
          clonedF(a, b);
        }
        expect(String(clonedF)).toBe(String(f)); // both called with same inputs in the same order
      },
      { extraParameters: fc.array(fc.tuple(fc.anything(), fc.anything()), { minLength: 1 }) }
    );
  });
});
