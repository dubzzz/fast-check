import { describe, it, expect, vi } from 'vitest';
import { uuid, UuidConstraints } from '../../../src/arbitrary/uuid';
import { fakeArbitraryStaticValue } from './__test-helpers__/ArbitraryHelpers';
import fc from 'fast-check';

import * as _IntegerMock from '../../../src/arbitrary/integer';
import type { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { fakeRandom } from './__test-helpers__/RandomHelpers';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';
const IntegerMock: { integer: (ct: { min: number; max: number }) => Arbitrary<number> } = _IntegerMock;

describe('uuid', () => {
  declareCleaningHooksForSpies();

  it('should produce the minimal uuid (v1-v5) given all minimal generated values', () => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = vi.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ min }) => {
      const { instance } = fakeArbitraryStaticValue(() => min);
      return instance;
    });

    // Act
    const arb = uuid();
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe('00000000-0000-1000-8000-000000000000');
  });

  it('should produce the maximal uuid (v1-v5) given all maximal generated values', () => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = vi.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ max }) => {
      const { instance } = fakeArbitraryStaticValue(() => max);
      return instance;
    });

    // Act
    const arb = uuid();
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe('ffffffff-ffff-5fff-bfff-ffffffffffff');
  });
});

describe('uuid (integration)', () => {
  type Extra = UuidConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      version: fc.oneof(
        fc.constantFrom(...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const)),
        fc.uniqueArray(fc.constantFrom(...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const)), {
          minLength: 1,
        }),
      ),
    },
    { requiredKeys: [] },
  );

  const isCorrect = (u: string, extra: Extra) => {
    expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const versions =
      extra.version !== undefined
        ? typeof extra.version === 'number'
          ? [extra.version]
          : extra.version
        : [1, 2, 3, 4, 5];
    const versionInValue = u[14];
    expect(versions.map((v) => v.toString(16))).toContain(versionInValue);
  };

  const uuidBuilder = (extra: Extra) => uuid(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(uuidBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(uuidBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(uuidBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(uuidBuilder, { extraParameters });
  });
});
