import { memo as memoOld } from '../../../src/arbitrary/memo';
import { NextArbitrary } from '../../../src/check/arbitrary/definition/NextArbitrary';
import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';
import { fakeRandom } from '../check/arbitrary/generic/RandomHelpers';

type NextMemo<T> = (maxDepth?: number) => NextArbitrary<T>;

function memo<T>(builder: (maxDepth: number) => NextArbitrary<T>): NextMemo<T> {
  const memoed = memoOld((d) => convertFromNext(builder(d)));
  return (maxDepth?: number) => convertToNext(memoed(maxDepth));
}

describe('memo', () => {
  it('should return the produced instance of arbitrary', () => {
    // Arrange
    const { instance: expectedArb } = fakeNextArbitrary();
    const builder = memo(() => expectedArb);

    // Act
    const arb = builder();

    // Assert
    expect(arb).toBe(expectedArb);
  });

  it('should cache arbitraries associated to each depth', () => {
    // Arrange
    const builder = memo(() => fakeNextArbitrary().instance);

    // Act
    const arb = builder();

    // Assert
    expect(builder(10)).toBe(builder(10));
    expect(builder(42)).toBe(builder(42));
    expect(builder(65500)).toBe(builder(65500));
    expect(builder()).toBe(arb);
  });

  it('should instantiate new arbitraries for each depth', () => {
    // Arrange
    const builder = memo(() => fakeNextArbitrary().instance);

    // Act
    const b10 = builder(10);
    const b42 = builder(42);

    // Assert
    expect(b10).not.toBe(b42);
  });

  it('should consider no depth as depth 10', () => {
    // Arrange
    const builder = memo(() => fakeNextArbitrary().instance);

    // Act
    const bDefault = builder();
    const b10 = builder(10);

    // Assert
    expect(bDefault).toBe(b10);
  });

  it('should automatically decrease depth for self recursive', () => {
    // Arrange
    const { instance: expectedArb } = fakeNextArbitrary();
    const memoFun = jest.fn();
    const builder = memo(memoFun);
    memoFun.mockImplementation((n) => (n <= 6 ? expectedArb : builder()));

    // Act
    builder();

    // Assert
    expect(memoFun.mock.calls).toEqual([[10], [9], [8], [7], [6]]);
  });

  it('should automatically interleave decrease depth for mutually recursive', () => {
    // Arrange
    const { instance: expectedArb } = fakeNextArbitrary();
    const memoFunA = jest.fn();
    const memoFunB = jest.fn();
    const builderA = memo(memoFunA);
    const builderB = memo(memoFunB);
    memoFunA.mockImplementation((n) => (n <= 6 ? expectedArb : builderB()));
    memoFunB.mockImplementation((n) => (n <= 6 ? expectedArb : builderA()));

    // Act
    builderA();

    // Assert
    expect(memoFunA.mock.calls).toEqual([[10], [8], [6]]);
    expect(memoFunB.mock.calls).toEqual([[9], [7]]);
  });

  it('should be able to override decrease depth', () => {
    // Arrange
    const { instance: expectedArb } = fakeNextArbitrary();
    const memoFun = jest.fn();
    const builder = memo(memoFun);
    memoFun.mockImplementation((n) => (n <= 0 ? expectedArb : builder(n - 3)));

    // Act
    builder();

    // Assert
    expect(memoFun.mock.calls).toEqual([[10], [7], [4], [1], [-2]]);
  });

  it('should be able to delay calls to sub-builders', () => {
    // Arrange
    const expectedBiasedFactor = 42;
    const { instance: simpleArb, generate } = fakeNextArbitrary();
    const { instance: mrng } = fakeRandom();

    // Act
    const builderA = memo(() => {
      const { instance: arbA, generate: generateA } = fakeNextArbitrary();
      generateA.mockImplementation((mrng, biasedFactor) => builderB().generate(mrng, biasedFactor));
      return arbA;
    });
    const builderB = memo(() => simpleArb);
    expect(generate).not.toHaveBeenCalled();
    builderA().generate(mrng, expectedBiasedFactor);

    // Assert
    expect(generate).toHaveBeenCalledWith(mrng, expectedBiasedFactor);
  });
});
