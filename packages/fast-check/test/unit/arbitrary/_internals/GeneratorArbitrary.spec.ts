import { GeneratorArbitrary } from '../../../../src/arbitrary/_internals/GeneratorArbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
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
  });
});

describe('GeneratorArbitrary (integration)', () => {});
