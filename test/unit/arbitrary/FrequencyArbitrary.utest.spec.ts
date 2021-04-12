import * as fc from '../../../lib/fast-check';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../src/check/arbitrary/definition/Shrinkable';
import { frequency } from '../../../src/arbitrary/frequency';
import { Random } from '../../../src/random/generator/Random';

import * as stubArb from '../stubs/arbitraries';

const frequencyValidInputsArb = fc
  .tuple(
    fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() }),
    fc.array(fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() })),
    fc.array(fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() }))
  )
  .map(([positiveWeightMeta, headingWeightsMeta, traillingWeightsMeta]) => {
    return [...headingWeightsMeta, positiveWeightMeta, ...traillingWeightsMeta].map((meta) => ({
      weight: meta.weight,
      arbitrary: stubArb.single(meta.arbitraryValue, true),
      expectedValue: meta.arbitraryValue,
    }));
  });

class LazyArb extends Arbitrary<any> {
  constructor(readonly arbBuilder: () => Arbitrary<any>) {
    super();
  }
  generate(mrng: Random): Shrinkable<any, any> {
    return this.arbBuilder().generate(mrng);
  }
  withBias(freq: number) {
    return this.arbBuilder().withBias(freq);
  }
}

describe('FrequencyArbitrary', () => {
  describe('frequency', () => {
    it('Should call Random generator to generate values between 0 and total weight (not included)', () =>
      fc.assert(
        fc.property(frequencyValidInputsArb, fc.nat(), (validInputs, generateSeed) => {
          // Arrange
          const arb = frequency(...validInputs);
          const totalWeight = validInputs.reduce((acc, cur) => acc + cur.weight, 0);
          const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn();
          nextInt.mockImplementation((a = 0, b = 0) => a + (generateSeed % (b - a + 1)));
          const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

          // Act
          arb.generate(fakeRandom);

          // Assert
          expect(nextInt).toHaveBeenCalledTimes(1);
          expect(nextInt).toHaveBeenCalledWith(0, totalWeight - 1);
        })
      ));
    it('Should call the right arbitrary to generate the value', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          fc.nat(),
          fc.nat(),
          (validInputs, arbitrarySelectionSeed, generateSeed) => {
            // Arrange
            const selectedArbitraryIndex = arbitrarySelectionSeed % validInputs.length;
            const selectedArbitrary = validInputs[selectedArbitraryIndex];
            fc.pre(selectedArbitrary.weight > 0);

            const totalWeightBefore = validInputs
              .slice(0, selectedArbitraryIndex)
              .reduce((acc, cur) => acc + cur.weight, 0);
            const arb = frequency(...validInputs);
            const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn();
            nextInt.mockImplementation(() => totalWeightBefore + (generateSeed % selectedArbitrary.weight));
            const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

            // Act
            const g = arb.generate(fakeRandom).value_;

            // Assert
            expect(g).toBe(selectedArbitrary.expectedValue);
          }
        )
      ));
    it('Should call the first arbitrary to generate the value when maxDepth of 0', () =>
      fc.assert(
        fc.property(frequencyValidInputsArb, (validInputs) => {
          // Arrange
          const arb = frequency({ maxDepth: 0 }, ...validInputs);
          const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn();
          const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

          // Act
          const g = arb.generate(fakeRandom).value_;

          // Assert
          expect(nextInt).not.toHaveBeenCalled();
          expect(g).toBe(validInputs[0].expectedValue);
        })
      ));
    it('Should call the first arbitrary to generate the value as soon as maxDepth has been reached', () => {
      // Arrange
      const arb: Arbitrary<any> = frequency(
        { maxDepth: 5 },
        { weight: 0, arbitrary: stubArb.single(0) },
        { weight: 1, arbitrary: new LazyArb(() => arb).map((d) => [d]) }
      );
      const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn().mockReturnValue(0);
      const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

      // Act
      const g = arb.generate(fakeRandom).value_;

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(5); // maxDepth
      expect(g).toEqual([[[[[0]]]]]); // const mapper = (d) => [d]; mapper(mapper(mapper(mapper(mapper(0))))) is [[[[[0]]]]]
    });
    it('Should not share depth accross distinct instances of frequency (if not requested)', () => {
      // Arrange
      const arb: Arbitrary<any> = frequency(
        { maxDepth: 1 },
        { weight: 0, arbitrary: stubArb.single(0) },
        {
          weight: 1,
          arbitrary: frequency(
            { maxDepth: 1 },
            { weight: 0, arbitrary: stubArb.single(0) },
            {
              weight: 1,
              arbitrary: frequency(
                { maxDepth: 1 },
                { weight: 0, arbitrary: stubArb.single(0) },
                { weight: 1, arbitrary: stubArb.single(1) }
              ).map((d) => [d]),
            }
          ).map((d) => [d]),
        }
      );
      const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn().mockReturnValue(0);
      const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

      // Act
      const g = arb.generate(fakeRandom).value_;

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(3); // once per instance of frequency
      expect(g).toEqual([[1]]);
    });
    it('Should share depth accross distinct instances of frequency if requested', () => {
      // Arrange
      const arb: Arbitrary<any> = frequency(
        { maxDepth: 1, depthIdentifier: 'toto' },
        { weight: 0, arbitrary: stubArb.single(0) },
        {
          weight: 1,
          arbitrary: frequency(
            { maxDepth: 1, depthIdentifier: 'titi' },
            { weight: 0, arbitrary: stubArb.single(0) },
            {
              weight: 1,
              arbitrary: frequency(
                { maxDepth: 1, depthIdentifier: 'toto' },
                { weight: 0, arbitrary: stubArb.single(0) },
                { weight: 1, arbitrary: stubArb.single(1) }
              ).map((d) => [d]),
            }
          ).map((d) => [d]),
        }
      );
      const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn().mockReturnValue(0);
      const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

      // Act
      const g = arb.generate(fakeRandom).value_;

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(2); // one for toto, one for titi
      expect(g).toEqual([[0]]);
    });
    it('Should ask ranges containing negative values as we go deeper in the structure if depthFactor', () => {
      // Arrange
      const arb: Arbitrary<any> = frequency(
        { depthFactor: 0.1 },
        { weight: 1, arbitrary: stubArb.single(0) },
        { weight: 1000, arbitrary: new LazyArb(() => arb).map((d) => [d]) }
      );
      const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn().mockImplementation((a, b) => {
        // we stop on the first negative value of a
        if (a < 0) return a;
        // otherwise we return b to go deeper in the tree
        else return b;
      });
      const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

      // Act
      arb.generate(fakeRandom).value_;

      // Assert
      expect(nextInt).toHaveBeenCalledWith(0, 1000); // first calls: 0-1000 contains 1001 values
      expect(nextInt).toHaveBeenCalledWith(-1, 1000); // as we go deeper (too deep)
    });
    it('Should never ask ranges containing negative values as we go deeper in the structure if depthFactor with weight of 0 on first arbitrary', () => {
      // Arrange
      const arb: Arbitrary<any> = frequency(
        { depthFactor: 0.1 },
        { weight: 0, arbitrary: stubArb.single(0) },
        { weight: 1000, arbitrary: new LazyArb(() => arb).map((d) => [d]) }
      );
      const nextInt: jest.Mock<number, [] | [number] | [number, number]> = jest.fn().mockImplementation((a, b) => {
        // we stop on the first negative value of a
        if (a < 0) return a;
        // otherwise we return b to go deeper in the tree
        else return b;
      });
      const fakeRandom = { nextInt: nextInt as Random['nextInt'] } as Random;

      // Act
      try {
        arb.generate(fakeRandom).value_;
        fail('Stack overflow expected as the structure is going deeper and deeper without any end case');
      } catch (err) {
        // noop
      }

      // Assert
      expect(nextInt).toHaveBeenCalledWith(0, 999); // first calls: 0-999 contains 1000 values
      expect(nextInt).not.toHaveBeenCalledWith(-1, 999); // never called as first arbitrary has a weight of zero
    });

    it('Should reject calls without any weighted arbitraries', () => {
      expect(() => frequency()).toThrowError();
    });
    it('Should reject calls without weight', () => {
      expect(() => frequency({ arbitrary: stubArb.single(0), weight: undefined! })).toThrowError(
        /expects weights to be integer values/
      );
    });
    it('Should reject calls without arbitrary', () => {
      expect(() => frequency({ arbitrary: undefined!, weight: 1 })).toThrowError(/expects arbitraries to be specified/);
    });
    it('Should reject calls including at least one strictly negative weight', () =>
      fc.assert(
        fc.property(
          fc.integer({ max: -1 }),
          fc.array(fc.nat()),
          fc.array(fc.nat()),
          (negativeWeight, headingWeights, traillingWeights) => {
            expect(() =>
              frequency(
                ...[...headingWeights, negativeWeight, ...traillingWeights].map((weight) => ({
                  weight,
                  arbitrary: stubArb.single(0),
                }))
              )
            ).toThrowError();
          }
        )
      ));
    it('Should reject calls having a total weight of zero', () =>
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), (numEntries) => {
          // Combined with: 'Should reject calls including at one strictly negative weight'
          // it means that we have: 'Should reject calls having a total weight inferior or equal to zero'
          expect(() =>
            frequency(
              ...[...Array(numEntries)].map(() => ({
                weight: 0,
                arbitrary: stubArb.single(0),
              }))
            )
          ).toThrowError();
        })
      ));
    it('Should not reject calls defining a strictly positive total weight without any negative weights', () =>
      fc.assert(
        fc.property(
          fc.integer({ min: 1 }),
          fc.array(fc.nat()),
          fc.array(fc.nat()),
          (positiveWeight, headingWeights, traillingWeights) => {
            expect(() =>
              frequency(
                ...[...headingWeights, positiveWeight, ...traillingWeights].map((weight) => ({
                  weight,
                  arbitrary: stubArb.single(0),
                }))
              )
            ).not.toThrowError();
          }
        )
      ));
  });
});
