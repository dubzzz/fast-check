import * as fc from '../../../lib/fast-check';
import { compareBooleanFunc } from '../../../src/arbitrary/compareBooleanFunc';
import { compareFunc } from '../../../src/arbitrary/compareFunc';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { hasCloneMethod, cloneIfNeeded } from '../../../src/check/symbols';
import {
  assertGenerateEquivalentTo,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from '../check/arbitrary/generic/NextArbitraryAssertions';
import { assertToStringIsSameFunction } from './__test-helpers__/ToStringIsSameFunction';

describe('compareBooleanFunc (integration)', () => {
  const compareBooleanFuncBuilder = () => convertToNext(compareBooleanFunc());

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(compareBooleanFuncBuilder, {
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
      compareBooleanFuncBuilder,
      (f, [a, b, c]) => {
        const ab = f(a, b);
        const bc = f(b, c);
        if (ab && bc) expect(f(a, c)).toBe(true);
        else if (!ab && !bc) expect(f(a, c)).toBe(false);
        // else: neither handled, nor skipped (yet)
      },
      { extraParameters: fc.tuple(fc.anything(), fc.anything(), fc.anything()) }
    );
  });

  it('should be false when a = b', () => {
    assertProduceCorrectValues(
      compareBooleanFuncBuilder,
      (f, a) => {
        expect(f(a, a)).toBe(false);
      },
      { extraParameters: fc.anything() }
    );
  });

  it('should be equivalent to compareFunc(a, b) < 0', () => {
    assertGenerateEquivalentTo(
      () => convertToNext(compareBooleanFunc()),
      () => convertToNext(compareFunc()).map((f) => (a, b) => f(a, b) < 0),
      {
        isEqual: (f, refF, [a, b]) => f(a, b) === refF(a, b),
        extraParameters: fc.tuple(fc.anything(), fc.anything()),
      }
    );
  });

  it('should give a re-usable string representation of the function', () => {
    assertProduceCorrectValues(compareBooleanFuncBuilder, (f, calls) => assertToStringIsSameFunction(f, calls), {
      extraParameters: fc.array(fc.tuple(fc.anything(), fc.anything())),
    });
  });

  it('should produce cloneable instances with independant histories', () => {
    assertProduceCorrectValues(
      compareBooleanFuncBuilder,
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
