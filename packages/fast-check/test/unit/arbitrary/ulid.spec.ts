import fc from 'fast-check';
import { ulid } from '../../../src/arbitrary/ulid';

import { assertProduceSameValueGivenSameSeed } from './__test-helpers__/ArbitraryAssertions';
import { integer } from '../../../src/arbitrary/integer';
import { tuple } from '../../../src/arbitrary/tuple';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('ulid (integration)', () => {
  function ulid40() {
    return integer({ min: 0, max: 0xffffffffff });
  }
  function ulid48() {
    return integer({ min: 0, max: 0xffffffffffff });
  }
  function ulidNoMap() {
    const timestampPartArbitrary = integer({ min: 0, max: 0xffffffffffff });
    const randomnessPartOneArbitrary = integer({ min: 0, max: 0xffffffffff });
    const randomnessPartTwoArbitrary = integer({ min: 0, max: 0xffffffffff });
    return tuple(timestampPartArbitrary, randomnessPartOneArbitrary, randomnessPartTwoArbitrary);
  }

  it('40bits', () => {
    assertProduceSameValueGivenSameSeed(ulid40);
  });

  it('48bits', () => {
    assertProduceSameValueGivenSameSeed(ulid48);
  });

  it('ulidNoMap', () => {
    assertProduceSameValueGivenSameSeed(ulidNoMap);
  });

  it('ulid', () => {
    assertProduceSameValueGivenSameSeed(ulid);
  });
});
