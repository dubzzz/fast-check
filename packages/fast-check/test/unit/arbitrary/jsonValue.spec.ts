import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import type { JsonSharedConstraints } from '../../../src/arbitrary/jsonValue.js';
import { jsonValue } from '../../../src/arbitrary/jsonValue.js';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions.js';
import { computeObjectDepth } from './__test-helpers__/ComputeObjectDepth.js';
import { isObjectWithNumericKeys } from './__test-helpers__/ObjectWithNumericKeys.js';
import { sizeArb } from './__test-helpers__/SizeHelpers.js';

describe('jsonValue (integration)', () => {
  type Extra = JsonSharedConstraints | undefined;
  const extraParameters: fc.Arbitrary<Extra> = fc.option(
    fc
      .record(
        {
          depthSize: fc.oneof(fc.double({ min: 0.1, noNaN: true }), sizeArb),
          maxDepth: fc.nat({ max: 5 }),
          noUnicodeString: fc.boolean(),
          stringUnit: fc.constantFrom<JsonSharedConstraints['stringUnit']>(
            'grapheme',
            'grapheme-composite',
            'grapheme-ascii',
            'binary',
            'binary-ascii',
          ),
        },
        { requiredKeys: [] },
      )
      .filter(
        (ct) =>
          ct.depthSize === undefined ||
          (typeof ct.depthSize === 'number' && ct.depthSize <= 10) ||
          ct.maxDepth !== undefined,
      ),
    { nil: undefined },
  );

  const isCorrect = (v: unknown, extra: Extra) => {
    // JSON.stringify does not handle the -0 properly
    // And fc.stringify produces '["__proto__"]:' whenever it encounters __proto__ as a key
    // Our 'safeStringified' should hanlde both of the problems!
    const intermediateStringified = fc.stringify(v);
    const safeStringified = intermediateStringified.replace(/\["__proto__"\]:/g, '"__proto__":');
    expect(JSON.parse(safeStringified)).toEqual(v);

    if (extra !== undefined && extra.maxDepth !== undefined) {
      expect(computeObjectDepth(v)).toBeLessThanOrEqual(extra.maxDepth);
    }
  };

  const jsonValueBuilder = (extra: Extra) => jsonValue(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(jsonValueBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(jsonValueBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(jsonValueBuilder, { extraParameters });
  });

  // Property: should be able to shrink to the same values without initial context
  // Is partially applicable given the fact that: Object.keys() has a specific handling of integer keys over string ones.
  // eg.: Object.keys({"2": "2", "0": "0", "C": "C", "A": "A", "B": "B", "1": "1"}) -> ["0", "1", "2", "C", "A", "B"]
  // As a consequence there is no way to rebuild the source array of tuples (key, value) in the right order in such case (when numerics).
  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(
      (extra) => jsonValueBuilder(extra).filter((o) => !isObjectWithNumericKeys(o)),
      { extraParameters },
    );
  });
});
