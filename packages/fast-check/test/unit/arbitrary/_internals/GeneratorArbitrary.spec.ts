import { GeneratorArbitrary } from '../../../../src/arbitrary/_internals/GeneratorArbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';
import { MockWithArgs } from '../../__test-helpers__/Mocked';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';

describe('GeneratorArbitrary', () => {
  describe('generate', () => {
    it('should be able to generate data from the requested arbitraries', () => {
      // Arrange
      const { instance: mrngCloned } = fakeRandom();
      const { instance: mrngSource, clone: cloneMrng } = fakeRandom();
      cloneMrng.mockReturnValue(mrngCloned);
      const biasFactor = 5;
      const firstValue = new Value(Symbol(), Symbol());
      const { instance: firstArbitrary, generate: firstGenerate } = fakeArbitrary<symbol>();
      firstGenerate.mockReturnValue(firstValue);
      const secondValue = new Value(Symbol(), Symbol());
      const { instance: secondArbitrary, generate: secondGenerate } = fakeArbitrary<symbol>();
      secondGenerate.mockReturnValue(secondValue);

      // Act
      const g = new GeneratorArbitrary();
      const gen = g.generate(mrngSource, biasFactor).value_;
      const firstOutput = gen(firstArbitrary);
      const secondOutput = gen(secondArbitrary);

      // Assert
      expect(firstOutput).toBe(firstValue.value_);
      expect(firstGenerate).toHaveBeenCalledTimes(1);
      expect(firstGenerate).toHaveBeenCalledWith(mrngCloned, biasFactor);
      expect(secondOutput).toBe(secondValue.value_);
      expect(secondGenerate).toHaveBeenCalledTimes(1);
      expect(secondGenerate).toHaveBeenCalledWith(mrngCloned, biasFactor); // receive the same mrng as firstGenerate
    });

    it('should produce a cloneable value generating values fed via the original mrng and bias', () => {
      // Arrange
      const { instance: mrngCloned } = fakeRandom();
      const { instance: mrngSource, clone: cloneMrng } = fakeRandom();
      cloneMrng.mockReturnValue(mrngCloned);
      const biasFactor = 5;
      const firstValue = new Value(Symbol(), Symbol());
      const { instance: firstArbitrary, generate: firstGenerate } = fakeArbitrary<symbol>();
      firstGenerate.mockReturnValue(firstValue);

      // Act
      const g = new GeneratorArbitrary();
      const genValue = g.generate(mrngSource, biasFactor);
      const gen = genValue.value;
      const firstOutput = gen(firstArbitrary);
      const genCloned = genValue.value;
      const firstClonedOutput = gen(firstArbitrary);

      // Assert
      expect(genCloned).not.toBe(gen);
      expect(firstOutput).toBe(firstValue.value_);
      expect(firstClonedOutput).toBe(firstValue.value_);
      expect(firstGenerate).toHaveBeenCalledTimes(2);
      expect(firstGenerate).toHaveBeenNthCalledWith(1, mrngCloned, biasFactor);
      expect(firstGenerate).toHaveBeenNthCalledWith(2, mrngCloned, biasFactor);
    });
  });

  describe('shrink', () => {
    it('should re-use previously generated instances for unchanged arbitraries', () => {
      // Arrange
      const { instance: mrng } = fakeRandomWithOffset();
      const biasFactor = 5;
      const first = buildArbitraryForGen('a', new Map([['a', ['b', 'c', 'd']]]));
      const second = buildArbitraryForGen('1', new Map([['1', ['2', '3']]]));

      // Act
      const seenShrinks: [string, string][] = [];
      const g = new GeneratorArbitrary();
      const genValue = g.generate(mrng, biasFactor);
      const gen = genValue.value;
      gen(first.instance); // fire-and-forget in the context of this test
      gen(second.instance); // fire-and-forget in the context of this test
      expect(first.generate).toHaveBeenCalledTimes(1);
      expect(first.shrink).not.toHaveBeenCalled();
      expect(second.generate).toHaveBeenCalledTimes(1);
      expect(second.shrink).not.toHaveBeenCalled();
      for (const shrink of g.shrink(gen, genValue.context)) {
        const genShrink = shrink.value;
        const firstShrinkValue = genShrink(first.instance);
        const secondShrinkValue = genShrink(second.instance);
        seenShrinks.push([firstShrinkValue, secondShrinkValue]);
      }

      // Assert
      expect(first.generate).toHaveBeenCalledTimes(1);
      expect(first.shrink).toHaveBeenCalledTimes(1);
      expect(second.generate).toHaveBeenCalledTimes(1);
      expect(second.shrink).toHaveBeenCalledTimes(1);
      expect(seenShrinks).toEqual([
        ['b', '1'], // current shrink implementation is based on tuples
        ['c', '1'],
        ['d', '1'],
        ['a', '2'],
        ['a', '3'],
      ]);
    });

    it('should use newly passed instances with mrng offset-ed correctly on diverging arbitraries', () => {
      // Arrange
      const { instance: mrng } = fakeRandomWithOffset();
      const biasFactor = 5;
      const first = buildArbitraryForGen('a', new Map([['a', ['b', 'c', 'd']]]));
      const second = buildArbitraryForGen('1', new Map([['1', ['2', '3']]]));

      // Act
      const seenShrinks: [string, string][] = [];
      const g = new GeneratorArbitrary();
      const genValue = g.generate(mrng, biasFactor);
      const gen = genValue.value;
      gen(first.instance); // fire-and-forget in the context of this test
      gen(second.instance); // fire-and-forget in the context of this test
      expect(first.generate).toHaveBeenCalledTimes(1);
      expect(first.shrink).not.toHaveBeenCalled();
      expect(second.generate).toHaveBeenCalledTimes(1);
      expect(second.shrink).not.toHaveBeenCalled();
      expect(first.offsetOnLastCall()).toBe(0); // offset-ed correctly by 0 arbitrary
      expect(second.offsetOnLastCall()).toBe(1); // offset-ed correctly by 1 arbitrary
      for (const shrink of g.shrink(gen, genValue.context)) {
        const third = buildArbitraryForGen('A', new Map());

        const genShrink = shrink.value;
        const firstShrinkValue = genShrink(first.instance);
        const thirdShrinkValue = genShrink(third.instance);
        seenShrinks.push([firstShrinkValue, thirdShrinkValue]);

        expect(third.generate).toHaveBeenCalledTimes(1); // need to call generate on thirdArbitrary
        expect(third.offsetOnLastCall()).toBe(1); // offset-ed correctly by 1 arbitrary
      }

      // Assert
      expect(first.generate).toHaveBeenCalledTimes(1);
      expect(first.shrink).toHaveBeenCalledTimes(1);
      expect(second.generate).toHaveBeenCalledTimes(1);
      expect(second.shrink).toHaveBeenCalledTimes(1);
      expect(seenShrinks).toEqual([
        ['b', 'A'], // current shrink implementation is based on tuples
        ['c', 'A'],
        ['d', 'A'],
        ['a', 'A'], // on ALL the original values, thus it tries 'a' and obviously in real world case
        ['a', 'A'], // the secondArbitrary should come back at this point as same inputs same arbitraries
      ]);
    });
  });
});

type RandomWithOffset = Random & { offset: number };
function fakeRandomWithOffset(): {
  instance: RandomWithOffset;
  clone: (() => RandomWithOffset) & MockWithArgs<() => RandomWithOffset>;
} {
  const { instance, clone } = fakeRandom();

  (instance as RandomWithOffset).offset = 0;
  clone.mockImplementation(() => {
    const newMrng = fakeRandomWithOffset().instance;
    newMrng.offset = (instance as RandomWithOffset).offset;
    return newMrng;
  });

  return {
    instance: instance as RandomWithOffset,
    clone: clone as (() => RandomWithOffset) & MockWithArgs<() => RandomWithOffset>,
  };
}

function buildArbitraryForGen(value: string, shrinks: Map<string, string[]>) {
  let offset = -1;

  const { instance, generate, shrink } = fakeArbitrary<string>();

  const firstValue = new Value(value[0], `c${value[0]}`);
  generate.mockImplementation((mrng) => {
    offset = (mrng as RandomWithOffset).offset;
    (mrng as RandomWithOffset).offset += 1;
    return firstValue;
  });
  shrink.mockImplementation((value) => {
    const subValues = shrinks.get(value) ?? [];
    return new Stream(subValues.map((v) => new Value(v, `c${v}`))[Symbol.iterator]());
  });

  return { instance, generate, shrink, offsetOnLastCall: () => offset };
}
