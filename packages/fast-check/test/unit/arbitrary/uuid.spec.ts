import { describe, it, expect, vi } from 'vitest';
import type { UuidConstraints } from '../../../src/arbitrary/uuid';
import { uuid } from '../../../src/arbitrary/uuid';
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

  it.each`
    version      | prettyVersion | expected
    ${undefined} | ${'v1 to v5'} | ${'00000000-0000-1000-8000-000000000000'}
    ${1}         | ${'v1'}       | ${'00000000-0000-1000-8000-000000000000'}
    ${2}         | ${'v2'}       | ${'00000000-0000-2000-8000-000000000000'}
    ${3}         | ${'v3'}       | ${'00000000-0000-3000-8000-000000000000'}
    ${4}         | ${'v4'}       | ${'00000000-0000-4000-8000-000000000000'}
    ${5}         | ${'v5'}       | ${'00000000-0000-5000-8000-000000000000'}
    ${10}        | ${'v10'}      | ${'00000000-0000-a000-8000-000000000000'}
    ${15}        | ${'v15'}      | ${'00000000-0000-f000-8000-000000000000'}
    ${[4, 7]}    | ${'v4 & v7'}  | ${'00000000-0000-4000-8000-000000000000'}
    ${[7, 4]}    | ${'v7 & v4'}  | ${'00000000-0000-7000-8000-000000000000' /* minimal with respect to the order in the declared version constraint */}
  `('should produce the minimal uuid ($prettyVersion) given all minimal generated values', ({ version, expected }) => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = vi.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ min }) => {
      const { instance } = fakeArbitraryStaticValue(() => min);
      return instance;
    });

    // Act
    const arb = uuid({ version });
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe(expected);
  });

  it.each`
    version      | prettyVersion | expected
    ${undefined} | ${'v1 to v5'} | ${'ffffffff-ffff-5fff-bfff-ffffffffffff'}
    ${1}         | ${'v1'}       | ${'ffffffff-ffff-1fff-bfff-ffffffffffff'}
    ${2}         | ${'v2'}       | ${'ffffffff-ffff-2fff-bfff-ffffffffffff'}
    ${3}         | ${'v3'}       | ${'ffffffff-ffff-3fff-bfff-ffffffffffff'}
    ${4}         | ${'v4'}       | ${'ffffffff-ffff-4fff-bfff-ffffffffffff'}
    ${5}         | ${'v5'}       | ${'ffffffff-ffff-5fff-bfff-ffffffffffff'}
    ${10}        | ${'v10'}      | ${'ffffffff-ffff-afff-bfff-ffffffffffff'}
    ${15}        | ${'v15'}      | ${'ffffffff-ffff-ffff-bfff-ffffffffffff'}
    ${[4, 7]}    | ${'v4 & v7'}  | ${'ffffffff-ffff-7fff-bfff-ffffffffffff'}
    ${[7, 4]}    | ${'v7 & v4'}  | ${'ffffffff-ffff-4fff-bfff-ffffffffffff' /* maximal with respect to the order in the declared version constraint */}
  `('should produce the maximal uuid ($prettyVersion) given all maximal generated values', ({ version, expected }) => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = vi.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ max }) => {
      const { instance } = fakeArbitraryStaticValue(() => max);
      return instance;
    });

    // Act
    const arb = uuid({ version });
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe(expected);
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
