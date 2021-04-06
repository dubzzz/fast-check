import { MemoArbitrary, memo as memoOld } from '../../../../src/check/arbitrary/MemoArbitrary';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { convertFromNext, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Stream } from '../../../../src/stream/Stream';

import { fakeNextArbitrary } from './generic/NextArbitraryHelpers';
import * as stubRng from '../../stubs/generators';

type NextMemo<T> = (maxDepth?: number) => NextArbitrary<T>;

const mrngNoCall = stubRng.mutable.nocall();
function memo<T>(builder: (maxDepth: number) => NextArbitrary<T>): NextMemo<T> {
  const memoed = memoOld((d) => convertFromNext(builder(d)));
  return (maxDepth?: number) => convertToNext(memoed(maxDepth));
}

describe('memo', () => {
  describe('builder', () => {
    it('should wrap the arbitrary into a MemoArbitrary', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();
      const builder = memo(() => expectedArb);

      // Act
      const arb = builder();

      // Assert
      expect(arb).toBeInstanceOf(MemoArbitrary);
      expect(((arb as any) as MemoArbitrary<any>).underlying).toBe(expectedArb);
    });

    it('should cache arbitraries associated to each depth', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();
      const builder = memo(() => expectedArb);

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
      const { instance: expectedArb } = fakeNextArbitrary();
      const builder = memo(() => expectedArb);

      // Act
      const b10 = builder(10);
      const b42 = builder(42);

      // Assert
      expect(b10).not.toBe(b42);
    });

    it('should consider no depth as depth 10', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();
      const builder = memo(() => expectedArb);

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

      // Act
      const builderA = memo(() => {
        const { instance: arbA, generate: generateA } = fakeNextArbitrary();
        generateA.mockImplementation((mrng, biasedFactor) => builderB().generate(mrng, biasedFactor));
        return arbA;
      });
      const builderB = memo(() => simpleArb);
      expect(generate).not.toHaveBeenCalled();
      builderA().generate(mrngNoCall, expectedBiasedFactor);

      // Assert
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasedFactor);
    });
  });

  describe('generate', () => {
    it('should call generate method of underlying on generate', () => {
      // Arrange
      const expectedBiasedFactor = 2;
      const expectedGen = Symbol();
      const expectedNextValue = new NextValue(expectedGen);
      const { instance: arb, generate } = fakeNextArbitrary();
      generate.mockReturnValue(expectedNextValue);

      // Act
      const memoArb = new MemoArbitrary(arb);
      const g = memoArb.generate(mrngNoCall, expectedBiasedFactor);

      // Assert
      expect(g).toBe(expectedNextValue);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasedFactor);
    });
  });

  describe('canGenerate', () => {
    it('should call canGenerate method of underlying on canGenerate', () => {
      // Arrange
      const expectedValue = Symbol();
      const { instance: arb, canGenerate } = fakeNextArbitrary();
      canGenerate.mockReturnValue(true);

      // Act
      const memoArb = new MemoArbitrary(arb);
      const out = memoArb.canGenerate(expectedValue);

      // Assert
      expect(out).toBe(true);
      expect(canGenerate).toHaveBeenCalledTimes(1);
      expect(canGenerate).toHaveBeenCalledWith(expectedValue);
    });
  });

  describe('shrink', () => {
    it('should call shrink method of underlying on shrink', () => {
      // Arrange
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const expectedShrinks = Stream.of(new NextValue(Symbol()));
      const { instance: arb, shrink } = fakeNextArbitrary();
      shrink.mockReturnValue(expectedShrinks);

      // Act
      const memoArb = new MemoArbitrary(arb);
      const out = memoArb.shrink(expectedValue, expectedContext);

      // Assert
      expect(out).toBe(expectedShrinks);
      expect(shrink).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledWith(expectedValue, expectedContext);
    });
  });
});
