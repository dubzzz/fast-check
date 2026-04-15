import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import type { JsonSharedConstraints } from '../../../src/arbitrary/json.js';
import { json } from '../../../src/arbitrary/json.js';
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

describe('json (integration)', () => {
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

  const isCorrect = (v: string, extra: Extra) => {
    expect(typeof v).toBe('string');
    const parsed = JSON.parse(v);
    // Re-stringifying the parsed value should give the same string
    expect(JSON.stringify(parsed)).toBe(v);

    if (extra !== undefined && extra.maxDepth !== undefined) {
      expect(computeObjectDepth(parsed)).toBeLessThanOrEqual(extra.maxDepth);
    }
  };

  const jsonBuilder = (extra: Extra) => json(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(jsonBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(jsonBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(jsonBuilder, { extraParameters });
  });

  // Property: should be able to shrink to the same values without initial context
  // Partially applicable given:
  // - Object.keys() reorders integer keys over string ones (same issue as jsonValue)
  // - JSON.stringify(-0) produces "0", but JSON.parse("0") gives 0 (not -0), creating different
  //   shrink paths when shrinking with vs without context. We filter at the jsonValue level to
  //   exclude -0 since this information is lost after JSON.stringify.
  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(
      (extra) =>
        jsonValue(extra)
          .filter((v) => !isObjectWithNumericKeys(v) && !containsMinusZero(v))
          .map(
            (v) => JSON.stringify(v),
            (s: unknown) => {
              if (typeof s !== 'string') {
                throw new Error('Cannot unmap the passed value');
              }
              return JSON.parse(s);
            },
          ),
      { extraParameters },
    );
  });
});

// Helpers

function containsMinusZero(value: unknown): boolean {
  if (Object.is(value, -0)) {
    return true;
  }
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return Object.values(value).some((v) => containsMinusZero(v));
}
