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
      const firstValue = new Value('a', 'ca');
      const { instance: firstArbitrary, generate: firstGenerate, shrink: firstShrink } = fakeArbitrary<string>();
      firstGenerate.mockReturnValue(firstValue);
      firstShrink.mockReturnValue(Stream.of(new Value('b', 'cb'), new Value('c', 'cc'), new Value('d', 'cd')));
      const secondValue = new Value('1', 'c1');
      const { instance: secondArbitrary, generate: secondGenerate, shrink: secondShrink } = fakeArbitrary<string>();
      secondGenerate.mockReturnValue(secondValue);
      secondShrink.mockReturnValue(Stream.of(new Value('2', 'c2'), new Value('3', 'c3')));

      // Act
      const seenShrinks: [string, string][] = [];
      const g = new GeneratorArbitrary();
      const genValue = g.generate(mrng, biasFactor);
      const gen = genValue.value;
      gen(firstArbitrary); // fire-and-forget in the context of this test
      gen(secondArbitrary); // fire-and-forget in the context of this test
      expect(firstGenerate).toHaveBeenCalledTimes(1);
      expect(firstShrink).not.toHaveBeenCalled();
      expect(secondGenerate).toHaveBeenCalledTimes(1);
      expect(secondShrink).not.toHaveBeenCalled();
      for (const shrink of g.shrink(gen, genValue.context)) {
        const genShrink = shrink.value;
        const firstShrinkValue = genShrink(firstArbitrary);
        const secondShrinkValue = genShrink(secondArbitrary);
        seenShrinks.push([firstShrinkValue, secondShrinkValue]);
      }

      // Assert
      expect(firstGenerate).toHaveBeenCalledTimes(1);
      expect(firstShrink).toHaveBeenCalledTimes(1);
      expect(secondGenerate).toHaveBeenCalledTimes(1);
      expect(secondShrink).toHaveBeenCalledTimes(1);
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
      let offsetOnCallFirst = -1;
      let offsetOnCallSecond = -1;
      const { instance: mrng } = fakeRandomWithOffset();
      const biasFactor = 5;
      const firstValue = new Value('a', 'ca');
      const { instance: firstArbitrary, generate: firstGenerate, shrink: firstShrink } = fakeArbitrary<string>();
      firstGenerate.mockImplementation((mrng) => {
        offsetOnCallFirst = (mrng as RandomWithOffset).offset;
        (mrng as RandomWithOffset).offset += 1;
        return firstValue;
      });
      firstShrink.mockReturnValue(Stream.of(new Value('b', 'cb'), new Value('c', 'cc'), new Value('d', 'cd')));
      const secondValue = new Value('1', 'c1');
      const { instance: secondArbitrary, generate: secondGenerate, shrink: secondShrink } = fakeArbitrary<string>();
      secondGenerate.mockImplementation((mrng) => {
        offsetOnCallSecond = (mrng as RandomWithOffset).offset;
        (mrng as RandomWithOffset).offset += 1;
        return secondValue;
      });
      secondShrink.mockReturnValue(Stream.of(new Value('2', 'c2'), new Value('3', 'c3')));

      // Act
      const seenShrinks: [string, string][] = [];
      const g = new GeneratorArbitrary();
      const genValue = g.generate(mrng, biasFactor);
      const gen = genValue.value;
      gen(firstArbitrary); // fire-and-forget in the context of this test
      gen(secondArbitrary); // fire-and-forget in the context of this test
      expect(firstGenerate).toHaveBeenCalledTimes(1);
      expect(firstShrink).not.toHaveBeenCalled();
      expect(secondGenerate).toHaveBeenCalledTimes(1);
      expect(secondShrink).not.toHaveBeenCalled();
      expect(offsetOnCallFirst).toBe(0); // offset-ed correctly by 0 arbitrary
      expect(offsetOnCallSecond).toBe(1); // offset-ed correctly by 1 arbitrary
      for (const shrink of g.shrink(gen, genValue.context)) {
        let offsetOnCallThird = -1;
        const thirdValue = new Value('A', 'cA');
        const { instance: thirdArbitrary, generate: thirdGenerate } = fakeArbitrary<string>();
        thirdGenerate.mockImplementation((mrng) => {
          offsetOnCallThird = (mrng as RandomWithOffset).offset;
          (mrng as RandomWithOffset).offset += 1;
          return thirdValue;
        });

        const genShrink = shrink.value;
        const firstShrinkValue = genShrink(firstArbitrary);
        const thirdShrinkValue = genShrink(thirdArbitrary);
        seenShrinks.push([firstShrinkValue, thirdShrinkValue]);

        expect(thirdGenerate).toHaveBeenCalledTimes(1); // need to call generate on thirdArbitrary
        expect(offsetOnCallThird).toBe(1); // offset-ed correctly by 1 arbitrary
      }

      // Assert
      expect(firstGenerate).toHaveBeenCalledTimes(1);
      expect(firstShrink).toHaveBeenCalledTimes(1);
      expect(secondGenerate).toHaveBeenCalledTimes(1);
      expect(secondShrink).toHaveBeenCalledTimes(1);
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
