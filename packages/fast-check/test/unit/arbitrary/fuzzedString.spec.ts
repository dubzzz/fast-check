import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { fuzzedString } from '../../../src/arbitrary/fuzzedString.js';

import {
  assertGenerateIndependentOfSize,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions.js';

describe('fuzzedString (integration)', () => {
  type Extra = { corpus: string[] };
  const extraParameters: fc.Arbitrary<Extra> = fc.record({
    corpus: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
  });

  const fuzzedStringBuilder = (extra: Extra) => fuzzedString(extra.corpus);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(fuzzedStringBuilder, { extraParameters });
  });

  it('should generate the same values regardless of the requested size', () => {
    assertGenerateIndependentOfSize(fuzzedStringBuilder, { extraParameters });
  });
});
