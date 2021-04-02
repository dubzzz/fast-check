import { MemoArbitrary, memo as memoOld } from '../../../../src/check/arbitrary/MemoArbitrary';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { Random } from '../../../../src/random/generator/Random';
import { convertFromNext, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';
import { Stream } from '../../../../src/stream/Stream';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';

import * as stubRng from '../../stubs/generators';

type NextMemo<T> = (maxDepth?: number) => NextArbitrary<T>;
function memo<T>(builder: (maxDepth: number) => NextArbitrary<T>): NextMemo<T> {
  const memoed = memoOld((d) => convertFromNext(builder(d)));
  return (maxDepth?: number) => convertToNext(memoed(maxDepth));
}

describe('MemoArbitrary', () => {
  describe('memo', () => {
    it('Should wrap the arbitrary into a MemoArbitrary', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const builder = memo(() => expectedArb);
      const arb = builder();

      expect(arb).toBeInstanceOf(MemoArbitrary);
      expect(((arb as any) as MemoArbitrary<any>).underlying).toBe(expectedArb);
    });
    it('Should cache arbitraries associated to each depth', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const builder = memo(() => expectedArb);
      const arb = builder();

      expect(builder(10)).toBe(builder(10));
      expect(builder(42)).toBe(builder(42));
      expect(builder(65500)).toBe(builder(65500));
      expect(builder()).toBe(arb);
    });
    it('Should instantiate new arbitraries for each depth', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const builder = memo(() => expectedArb);

      expect(builder(10)).not.toBe(builder(42));
    });
    it('Should consider no depth as depth 10', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const builder = memo(() => expectedArb);

      expect(builder()).toBe(builder(10));
    });
    it('Should automatically decrease depth for self recursive', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const memoFun = jest.fn();
      memoFun.mockImplementation((n) => (n <= 6 ? expectedArb : builder()));
      const builder = memo(memoFun);

      builder();

      expect(memoFun.mock.calls).toEqual([[10], [9], [8], [7], [6]]);
    });
    it('Should automatically interleave decrease depth for mutually recursive', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const memoFunA = jest.fn();
      memoFunA.mockImplementation((n) => (n <= 6 ? expectedArb : builderB()));
      const memoFunB = jest.fn();
      memoFunB.mockImplementation((n) => (n <= 6 ? expectedArb : builderA()));
      const builderA = memo(memoFunA);
      const builderB = memo(memoFunB);

      builderA();

      expect(memoFunA.mock.calls).toEqual([[10], [8], [6]]);
      expect(memoFunB.mock.calls).toEqual([[9], [7]]);
    });
    it('Should be able to override decrease depth', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const memoFun = jest.fn();
      memoFun.mockImplementation((n) => (n <= 0 ? expectedArb : builder(n - 3)));
      const builder = memo(memoFun);

      builder();

      expect(memoFun.mock.calls).toEqual([[10], [7], [4], [1], [-2]]);
    });
    it('Should be able to delay calls to sub-builders', () => {
      const mrng = stubRng.mutable.nocall();
      const expectedBiasedFactor = 42;
      const generateMock = jest.fn();
      const simpleArb = buildArbitrary(generateMock);
      const builderA = memo(() => buildArbitrary((mrng, biasedFactor) => builderB().generate(mrng, biasedFactor)));
      const builderB = memo(() => simpleArb);

      expect(generateMock).not.toHaveBeenCalled();
      builderA().generate(mrng, expectedBiasedFactor);

      expect(generateMock).toHaveBeenCalledWith(mrng, expectedBiasedFactor);
    });
  });
  describe('MemoArbitrary', () => {
    it('Should call generate method of underlying on generate', () => {
      const mrng = stubRng.mutable.nocall();
      const expectedBiasedFactor = 2;
      const expectedGen = Symbol();
      const generateMock = jest.fn();
      generateMock.mockReturnValue(expectedGen);
      const arb = buildArbitrary(generateMock);
      const memoArb = new MemoArbitrary(arb);

      const g = memoArb.generate(mrng, expectedBiasedFactor);
      expect(g).toBe(expectedGen);
      expect(generateMock).toHaveBeenCalledTimes(1);
      expect(generateMock).toHaveBeenCalledWith(mrng, expectedBiasedFactor);
    });
  });
});

const buildArbitrary = (
  generate: (mrng: Random, biasedFactor: number | undefined) => NextValue<any>,
  withBias?: (n: number) => NextArbitrary<any>
) => {
  return new (class extends NextArbitrary<any> {
    generate(mrng: Random, biasedFactor: number | undefined) {
      return generate(mrng, biasedFactor);
    }
    canGenerate(value: unknown): value is any {
      throw new Error('Method not implemented.');
    }
    shrink(_value: any, _context?: unknown): Stream<NextValue<any>> {
      throw new Error('Method not implemented.');
    }
    withBias(n: number): NextArbitrary<any> {
      return withBias ? withBias(n) : this;
    }
  })();
};
