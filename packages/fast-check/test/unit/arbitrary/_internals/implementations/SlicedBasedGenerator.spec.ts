import fc from 'fast-check';
import { SlicedBasedGenerator } from '../../../../../src/arbitrary/_internals/implementations/SlicedBasedGenerator';
import { Value } from '../../../../../src/check/arbitrary/definition/Value';
import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers';
import { fakeRandom } from '../../__test-helpers__/RandomHelpers';

describe('SlicedBasedGenerator', () => {
  describe('attemptExact', () => {
    it('should take one of the provided slices and return it item by item', () => {
      fc.assert(
        fc.property(
          fc.array(fc.array(fc.anything(), { minLength: 1 }), { minLength: 1 }),
          fc.nat(),
          fc.nat(),
          fc.integer({ min: 2 }),
          (slices, targetLengthMod, selectOneMod, biasFactor) => {
            // Arrange
            const { instance: arb } = fakeArbitrary();
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt
              .mockReturnValueOnce(1) // 1 to go for "value from slices"
              .mockImplementationOnce((min, max) => (selectOneMod % (max - min + 1)) + min);
            const targetLength = slices[targetLengthMod % slices.length].length;

            // Act
            const generator = new SlicedBasedGenerator(arb, mrng, slices, biasFactor);
            const readFromGenerator: unknown[] = [];
            generator.attemptExact(targetLength);
            for (let index = 0; index !== targetLength; ++index) {
              readFromGenerator.push(generator.next().value);
            }

            // Assert
            expect(nextInt).toHaveBeenCalledTimes(2); // only called twice: 1/ to bias to one of the slices 2/ to select which one
            expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
            expect(slices).toContainEqual(readFromGenerator);
          }
        )
      );
    });
  });

  describe('next', () => {
    it('should only go for values coming from the source arbitrary when tossing for unbias', () => {
      fc.assert(
        fc.property(
          fc.array(fc.array(fc.anything(), { minLength: 1 }), { minLength: 1 }),
          fc.infiniteStream(fc.anything()),
          fc.nat({ max: 10 }),
          fc.integer({ min: 2 }),
          (slices, streamValues, targetLength, biasFactor) => {
            // Arrange
            const producedValues: unknown[] = [];
            const { instance: arb, generate } = fakeArbitrary();
            generate.mockImplementation(() => {
              const value = streamValues.next().value;
              const context = streamValues.next().value;
              producedValues.push(value);
              return new Value(value, context);
            });
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockImplementation((_min, max) => max); // >min ie in [min+1,max] corresponds to unbiased

            // Act
            const generator = new SlicedBasedGenerator(arb, mrng, slices, biasFactor);
            const readFromGenerator: unknown[] = [];
            generator.attemptExact(targetLength);
            for (let index = 0; index !== targetLength; ++index) {
              readFromGenerator.push(generator.next().value);
            }

            // Assert
            expect(generate).toHaveBeenCalledTimes(targetLength);
            expect(readFromGenerator).toEqual(producedValues);
          }
        )
      );
    });

    it('should only go for values coming from the slices when tossing for bias', () => {
      fc.assert(
        fc.property(
          fc.array(fc.array(fc.anything(), { minLength: 1 }), { minLength: 1 }),
          fc.infiniteStream(fc.nat()),
          fc.nat({ max: 10 }),
          fc.integer({ min: 2 }),
          fc.boolean(),
          (slices, streamModValues, targetLength, biasFactor, withAttemptExact) => {
            // Arrange
            const { instance: arb, generate } = fakeArbitrary();
            const { instance: mrng, nextInt } = fakeRandom();

            // Act
            const generator = new SlicedBasedGenerator(arb, mrng, slices, biasFactor);
            const readFromGenerator: unknown[] = [];
            if (withAttemptExact) {
              nextInt.mockImplementation((_min, max) => max); // no bias for attemptExact
              generator.attemptExact(targetLength);
            }
            for (let index = 0; index !== targetLength; ++index) {
              let returnedBias = false;
              nextInt.mockImplementation((min, max) => {
                if (!returnedBias) {
                  returnedBias = true;
                  return min; // ask for bias, to make sure we use slices
                }
                return (streamModValues.next().value % (max - min + 1)) + min; // pure random for next calls
              });
              readFromGenerator.push(generator.next().value);
            }

            // Assert
            expect(generate).not.toHaveBeenCalled();
          }
        )
      );
    });
  });
});
