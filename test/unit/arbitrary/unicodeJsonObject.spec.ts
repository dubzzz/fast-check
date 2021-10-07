import fc from '../../../lib/fast-check';

import { unicodeJsonObject, JsonSharedConstraints } from '../../../src/arbitrary/unicodeJsonObject';
import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { computeObjectDepth } from './__test-helpers__/ComputeObjectDepth';

describe('unicodeJsonObject (integration)', () => {
  type Extra = JsonSharedConstraints | undefined;
  const extraParameters: fc.Arbitrary<Extra> = fc.option(
    fc.record({
      maxDepth: fc.nat({ max: 5 }),
    }),
    { nil: undefined }
  );

  const isCorrect = (v: unknown, extra: Extra) => {
    expect(JSON.parse(fc.stringify(v))).toEqual(v); // JSON.stringify does not handle the -0 properly
    if (extra !== undefined && extra.maxDepth !== undefined) {
      expect(computeObjectDepth(v)).toBeLessThanOrEqual(extra.maxDepth);
    }
  };

  const unicodeJsonObjectBuilder = (extra: Extra) =>
    convertToNext(extra !== undefined ? unicodeJsonObject(extra) : unicodeJsonObject());

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(unicodeJsonObjectBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(unicodeJsonObjectBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(unicodeJsonObjectBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(unicodeJsonObjectBuilder, { extraParameters });
  });
});
