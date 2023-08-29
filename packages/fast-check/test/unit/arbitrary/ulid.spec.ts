import fc from 'fast-check';
import { ulid } from '../../../src/arbitrary/ulid';
import { fakeArbitraryStaticValue } from './__test-helpers__/ArbitraryHelpers';

import * as _IntegerMock from '../../../src/arbitrary/integer';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { fakeRandom } from './__test-helpers__/RandomHelpers';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
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

describe('ulid', () => {
  it('should produce the minimal ulid given all minimal generated values', () => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = jest.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ min }) => {
      const { instance } = fakeArbitraryStaticValue(() => min);
      return instance;
    });

    // Act
    const arb = ulid();
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe('0'.repeat(26));
  });

  it('should produce the maximal ulid given all maximal generated values', () => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = jest.spyOn(IntegerMock, 'integer');
    integer.mockImplementation(({ max }) => {
      const { instance } = fakeArbitraryStaticValue(() => max);
      return instance;
    });

    // Act
    const arb = ulid();
    const out = arb.generate(mrng, undefined);

    // Assert
    expect(out.value).toBe('7ZZZZZZZZZZZZZZZZZZZZZZZZZ');
  });
});

describe('ulid (integration)', () => {
  const isCorrect = (u: string) => {
    expect(u).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
  };

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(ulid);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(ulid, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(ulid);
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(ulid);
  });
});
