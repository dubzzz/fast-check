import { boolean } from '../../../src/arbitrary/boolean';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as IntegerMock from '../../../src/arbitrary/integer';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('boolean', () => {
  it('should only ask for two integer values without any bias', () => {
    // Arrange
    const { integer, unbiasedInstance } = prepare();

    // Act
    const arb = boolean();

    // Assert
    expect(arb).toBe(unbiasedInstance);
    expect(integer).toHaveBeenCalledTimes(1);
    expect(integer).toHaveBeenCalledWith({ min: 0, max: 1 });
  });

  it('should produce true and false using the mapper', () => {
    // Arrange
    const { map } = prepare();

    // Act
    boolean();
    const mapper = map.mock.calls[0][0];

    // Assert
    expect(mapper(0)).toBe(false);
    expect(mapper(1)).toBe(true);
  });

  it('should produce 0 and 1 using the unmapper', () => {
    // Arrange
    const { map } = prepare();

    // Act
    boolean();
    const unmapper = map.mock.calls[0][1]!;

    // Assert
    expect(unmapper(false)).toBe(0);
    expect(unmapper(true)).toBe(1);
  });
});

// Helpers

function prepare() {
  const { instance, map } = fakeArbitrary<number>();
  const { instance: mappedInstance, noBias } = fakeArbitrary<boolean>();
  const { instance: unbiasedInstance } = fakeArbitrary<boolean>();
  const integer = jest.spyOn(IntegerMock, 'integer');
  integer.mockReturnValue(instance);
  map.mockReturnValue(mappedInstance);
  noBias.mockReturnValue(unbiasedInstance);
  return { map, integer, unbiasedInstance };
}
