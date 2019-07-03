import { MemoArbitrary, memo } from '../../../../src/check/arbitrary/MemoArbitrary';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../src/random/generator/Random';

import * as stubRng from '../../stubs/generators';

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
      memoFun.mockImplementation(n => (n <= 6 ? expectedArb : builder()));
      const builder = memo(memoFun);

      builder();

      expect(memoFun.mock.calls).toEqual([[10], [9], [8], [7], [6]]);
    });
    it('Should automatically interleave decrease depth for mutually recursive', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const memoFunA = jest.fn();
      memoFunA.mockImplementation(n => (n <= 6 ? expectedArb : builderB()));
      const memoFunB = jest.fn();
      memoFunB.mockImplementation(n => (n <= 6 ? expectedArb : builderA()));
      const builderA = memo(memoFunA);
      const builderB = memo(memoFunB);

      builderA();

      expect(memoFunA.mock.calls).toEqual([[10], [8], [6]]);
      expect(memoFunB.mock.calls).toEqual([[9], [7]]);
    });
    it('Should be able to override decrease depth', () => {
      const expectedArb = buildArbitrary(jest.fn());
      const memoFun = jest.fn();
      memoFun.mockImplementation(n => (n <= 0 ? expectedArb : builder(n - 3)));
      const builder = memo(memoFun);

      builder();

      expect(memoFun.mock.calls).toEqual([[10], [7], [4], [1], [-2]]);
    });
    it('Should be able to delay calls to sub-builders', () => {
      const mrng = stubRng.mutable.nocall();
      const generateMock = jest.fn();
      const simpleArb = buildArbitrary(generateMock);
      const builderA = memo(() => buildArbitrary(mrng => builderB().generate(mrng)));
      const builderB = memo(() => simpleArb);

      expect(generateMock).not.toHaveBeenCalled();
      builderA().generate(mrng);

      expect(generateMock).toHaveBeenCalled();
    });
  });
  describe('MemoArbitrary', () => {
    it('Should call generate method of underlying on generate', () => {
      const mrng = stubRng.mutable.nocall();
      const expectedGen = Symbol();
      const generateMock = jest.fn();
      generateMock.mockReturnValue(expectedGen);
      const arb = buildArbitrary(generateMock);
      const memoArb = new MemoArbitrary(arb);

      const g = memoArb.generate(mrng);
      expect(g).toBe(expectedGen);
      expect(generateMock).toHaveBeenCalledTimes(1);
    });
    it('Should be able to bias to the biased value of underlying', () => {
      const noCallMock = jest.fn();
      const biasedArb = buildArbitrary(noCallMock);
      const arb = buildArbitrary(noCallMock, () => biasedArb);
      const memoArb = new MemoArbitrary(arb);

      const biasedLazy = memoArb.withBias(2);
      expect(biasedLazy).toBe(biasedArb);
      expect(noCallMock).not.toHaveBeenCalled();
    });
    it('Should cache biased arbitrary for same freq', () => {
      const biasArb48 = buildArbitrary(jest.fn());
      const biasMock = jest.fn();
      biasMock.mockImplementationOnce(() => biasArb48);
      const arb = buildArbitrary(jest.fn(), biasMock);
      const memoArb = new MemoArbitrary(arb);

      memoArb.withBias(48);
      biasMock.mockClear();

      expect(memoArb.withBias(48)).toBe(biasArb48);
      expect(biasMock).not.toBeCalled();
    });
    it('Should not take from cache if freq changed', () => {
      const biasArb48 = buildArbitrary(jest.fn());
      const biasArb69 = buildArbitrary(jest.fn());
      const biasMock = jest.fn();
      biasMock.mockImplementationOnce(() => biasArb48).mockImplementationOnce(() => biasArb69);
      const arb = buildArbitrary(jest.fn(), biasMock);
      const memoArb = new MemoArbitrary(arb);

      memoArb.withBias(48);
      biasMock.mockClear();

      expect(memoArb.withBias(69)).toBe(biasArb69);
      expect(biasMock).toBeCalled();
    });
  });
});

const buildArbitrary = (generate: (mrng: Random) => Shrinkable<any>, withBias?: (n: number) => Arbitrary<any>) => {
  return new (class extends Arbitrary<any> {
    generate = generate;
    withBias = (n: number): Arbitrary<any> => (withBias ? withBias(n) : this);
  })();
};
