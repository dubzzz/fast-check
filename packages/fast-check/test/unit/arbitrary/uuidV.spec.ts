import fc from '../../../lib/fast-check';
import { uuidV } from '../../../src/arbitrary/uuidV';
import { fakeArbitraryStaticValue } from './__test-helpers__/ArbitraryHelpers';

import * as _IntegerMock from '../../../src/arbitrary/integer';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { fakeRandom } from './__test-helpers__/RandomHelpers';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
const IntegerMock: { integer: (ct: { min: number; max: number }) => Arbitrary<number> } = _IntegerMock;

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('uuidV', () => {
  it.each`
    version | expected
    ${1}    | ${'00000000-0000-1000-8000-000000000000'}
    ${2}    | ${'00000000-0000-2000-8000-000000000000'}
    ${3}    | ${'00000000-0000-3000-8000-000000000000'}
    ${4}    | ${'00000000-0000-4000-8000-000000000000'}
    ${5}    | ${'00000000-0000-5000-8000-000000000000'}
  `('should produce the minimal uuid (v$version) given all minimal generated values', ({ version, expected }) => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = jest.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ min }) => {
      const { instance } = fakeArbitraryStaticValue(() => min);
      return instance;
    });

    // Act
    const arb = uuidV(version);
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe(expected);
  });

  it.each`
    version | expected
    ${1}    | ${'ffffffff-ffff-1fff-bfff-ffffffffffff'}
    ${2}    | ${'ffffffff-ffff-2fff-bfff-ffffffffffff'}
    ${3}    | ${'ffffffff-ffff-3fff-bfff-ffffffffffff'}
    ${4}    | ${'ffffffff-ffff-4fff-bfff-ffffffffffff'}
    ${5}    | ${'ffffffff-ffff-5fff-bfff-ffffffffffff'}
  `('should produce the maximal uuid (v$version) given all maximal generated values', ({ version, expected }) => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = jest.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ max }) => {
      const { instance } = fakeArbitraryStaticValue(() => max);
      return instance;
    });

    // Act
    const arb = uuidV(version);
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe(expected);
  });
});

describe('uuidV (integration)', () => {
  type Extra = 1 | 2 | 3 | 4 | 5;
  const extraParameters: fc.Arbitrary<Extra> = fc.constantFrom(...([1, 2, 3, 4, 5] as const));

  const isCorrect = (u: string, extra: Extra) => {
    expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[12345][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(u[14]).toBe(String(extra));
  };

  const uuidVBuilder = (extra: Extra) => uuidV(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(uuidVBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(uuidVBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(uuidVBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(uuidVBuilder, { extraParameters });
  });
});
