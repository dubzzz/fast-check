import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import type { JsonSharedConstraints } from '../../../src/arbitrary/json.js';
import { json } from '../../../src/arbitrary/json.js';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/ArbitraryAssertions.js';
import { computeObjectDepth } from './__test-helpers__/ComputeObjectDepth.js';
import { sizeArb } from './__test-helpers__/SizeHelpers.js';

describe('json (integration)', () => {
  type Extra = JsonSharedConstraints | undefined;
  const extraParameters: fc.Arbitrary<Extra> = fc.option(
    fc
      .record(
        {
          depthSize: sizeArb,
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
      .filter((ct) => ct.depthSize === undefined || ct.maxDepth !== undefined),
    { nil: undefined },
  );

  const isCorrect = (v: string, extra: Extra) => {
    // Parsing must not throw — this validates the output is valid JSON
    const parsed = JSON.parse(v);
    expect(typeof parsed).not.toBe('undefined');

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

  // assertShrinkProducesSameValueWithoutInitialContext is not applicable:
  // JSON.stringify(-0) produces "0" but JSON.parse("0") gives 0 (not -0), and
  // numeric keys get reordered by Object.keys — both cause divergent shrink paths.
});
