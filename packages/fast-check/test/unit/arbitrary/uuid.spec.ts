import fc from 'fast-check';
import { uuid } from '../../../src/arbitrary/uuid';
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

describe('uuid', () => {
  it('should produce the minimal uuid (v1-v5) given all minimal generated values', () => {
    // Arrange
    const { instance: mrng } = fakeRandom();
    const integer = jest.spyOn(IntegerMock, 'integer');
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
    const integer = jest.spyOn(IntegerMock, 'integer');
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
  const isCorrect = (u: string) => {
    expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[12345][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  };

  const uuidVBuilder = () => uuid();

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(uuidVBuilder);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(uuidVBuilder, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(uuidVBuilder);
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(uuidVBuilder);
  });
});
