import * as fc from '../../../../lib/fast-check';
import { FrequencyArbitrary, _Constraints } from '../../../../src/arbitrary/_internals/FrequencyArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';
import { FakeIntegerArbitrary, fakeNextArbitrary } from '../../check/arbitrary/generic/NextArbitraryHelpers';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';
import * as DepthContextMock from '../../../../src/arbitrary/_internals/helpers/DepthContext';
import { Stream } from '../../../../src/stream/Stream';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

const frequencyValidInputsArb = fc
  .tuple(
    fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() }),
    fc.array(fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() })),
    fc.array(fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() }))
  )
  .map(([positiveWeightMeta, headingWeightsMeta, traillingWeightsMeta]) => [
    ...headingWeightsMeta,
    positiveWeightMeta,
    ...traillingWeightsMeta,
  ]);

const fromValidInputs = (metas: { weight: number; arbitraryValue: number }[]) =>
  metas.map((meta) => {
    const expectedContext = Symbol();
    const arbitraryMeta = fakeNextArbitrary<number>();
    arbitraryMeta.generate.mockReturnValue(new NextValue(meta.arbitraryValue, expectedContext));
    return {
      weight: meta.weight,
      arbitraryMeta,
      arbitrary: arbitraryMeta.instance,
      expectedValue: meta.arbitraryValue,
      expectedContext,
      fallbackValue: undefined as { default: number } | undefined,
    };
  });

const frequencyConstraintsArbFor = (keys: {
  forbidden?: (keyof _Constraints)[];
  required?: (keyof _Constraints)[];
}): fc.Arbitrary<_Constraints> => {
  const { forbidden = [], required = [] } = keys;
  return fc.record(
    {
      ...(!forbidden.includes('depthIdentifier') ? { depthIdentifier: fc.string() } : {}),
      ...(!forbidden.includes('depthFactor')
        ? { depthFactor: fc.double({ min: 0.01, noDefaultInfinity: true, noNaN: true }) }
        : {}),
      ...(!forbidden.includes('maxDepth') ? { maxDepth: fc.nat() } : {}),
      ...(!forbidden.includes('withCrossShrink') ? { withCrossShrink: fc.boolean() } : {}),
    },
    { requiredKeys: required }
  );
};

describe('FrequencyArbitrary', () => {
  describe('from', () => {
    it('should build instances of FrequencyArbitrary', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.nat(),
          (validInputs, constraints, depth) => {
            // Arrange
            const warbs = fromValidInputs(validInputs);
            const depthContext = { depth };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');

            // Assert
            expect(arb).toBeInstanceOf(FrequencyArbitrary);
          }
        )
      ));

    it('should always use the context coming from getDepthContextFor', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.nat(),
          (validInputs, constraints, depth) => {
            // Arrange
            const warbs = fromValidInputs(validInputs);
            const depthContext = { depth };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const typedArb = arb as FrequencyArbitrary<number>;

            // Assert
            expect(getDepthContextFor).toHaveBeenCalledTimes(1);
            expect(getDepthContextFor).toHaveBeenCalledWith(constraints.depthIdentifier);
            expect(typedArb.context).toBe(depthContext);
          }
        )
      ));

    it('should reject calls without any weighted arbitraries', () => {
      // Arrange / Act / Assert
      expect(() => FrequencyArbitrary.from([], {}, 'test')).toThrowError();
    });

    it('should reject calls without weight', () => {
      // Arrange / Act / Assert
      expect(() =>
        FrequencyArbitrary.from([{ arbitrary: fakeNextArbitrary(), weight: undefined! }], {}, 'test')
      ).toThrowError(/expects weights to be integer values/);
    });

    it('should reject calls without arbitrary', () => {
      // Arrange / Act / Assert
      expect(() => FrequencyArbitrary.from([{ arbitrary: undefined!, weight: 1 }], {}, 'test')).toThrowError(
        /expects arbitraries to be specified/
      );
    });

    it('should reject calls including at least one strictly negative weight', () =>
      fc.assert(
        fc.property(
          fc.integer({ max: -1 }),
          fc.array(fc.nat()),
          fc.array(fc.nat()),
          (negativeWeight, headingWeights, traillingWeights) => {
            // Arrange
            const weightedArbs = [...headingWeights, negativeWeight, ...traillingWeights].map((weight) => ({
              weight,
              arbitrary: fakeNextArbitrary(),
            }));

            // Act / Assert
            expect(() => FrequencyArbitrary.from(weightedArbs, {}, 'test')).toThrowError();
          }
        )
      ));

    it('should reject calls having a total weight of zero', () =>
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), (numEntries) => {
          // Arrange
          const weightedArbs = [...Array(numEntries)].map(() => ({
            weight: 0,
            arbitrary: fakeNextArbitrary(),
          }));

          // Act / Assert
          // Combined with: 'Should reject calls including at one strictly negative weight'
          // it means that we have: 'Should reject calls having a total weight inferior or equal to zero'
          expect(() => FrequencyArbitrary.from(weightedArbs, {}, 'test')).toThrowError();
        })
      ));

    it('should not reject calls defining a strictly positive total weight without any negative weights', () =>
      fc.assert(
        fc.property(
          fc.integer({ min: 1 }),
          fc.array(fc.nat()),
          fc.array(fc.nat()),
          (positiveWeight, headingWeights, traillingWeights) => {
            // Arrange
            const weightedArbs = [...headingWeights, positiveWeight, ...traillingWeights].map((weight) => ({
              weight,
              arbitrary: fakeNextArbitrary(),
            }));

            // Act / Assert
            expect(() => FrequencyArbitrary.from(weightedArbs, {}, 'test')).not.toThrowError();
          }
        )
      ));
  });

  describe('generate', () => {
    it('should call Random generator to generate values between 0 and total weight (not included)', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (validInputs, constraints, biasFactor, generateSeed) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const totalWeight = warbs.reduce((acc, cur) => acc + cur.weight, 0);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockImplementation((a = 0, b = 0) => a + (generateSeed % (b - a + 1)));

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            arb.generate(mrng, biasFactor);

            // Assert
            expect(nextInt).toHaveBeenCalledTimes(1);
            expect(nextInt).toHaveBeenCalledWith(0, totalWeight - 1);
          }
        )
      ));

    it('should call the right arbitrary to generate the value', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          fc.nat(),
          (validInputs, constraints, biasFactor, arbitrarySelectionSeed, generateSeed) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const selectedArbitraryIndex = arbitrarySelectionSeed % warbs.length;
            const selectedArbitrary = warbs[selectedArbitraryIndex];
            fc.pre(selectedArbitrary.weight > 0);

            const totalWeightBefore = warbs.slice(0, selectedArbitraryIndex).reduce((acc, cur) => acc + cur.weight, 0);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockImplementation(() => totalWeightBefore + (generateSeed % selectedArbitrary.weight));

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const g = arb.generate(mrng, biasFactor).value;

            // Assert
            expect(g).toBe(selectedArbitrary.expectedValue);
            expect(selectedArbitrary.arbitraryMeta.generate).toHaveBeenCalledTimes(1);
            expect(selectedArbitrary.arbitraryMeta.generate).toHaveBeenCalledWith(mrng, biasFactor);
          }
        )
      ));

    it('should always call the first arbitrary to generate the value when maxDepth has been reached', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ required: ['maxDepth'] }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (validInputs, constraints, biasFactor, overflowFromMaxDepth) => {
            // Arrange
            const warbs = fromValidInputs(validInputs);
            const requestedMaxDepth = constraints.maxDepth!;
            const { instance: mrng, nextInt } = fakeRandom();
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue({ depth: requestedMaxDepth + overflowFromMaxDepth });

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const g = arb.generate(mrng, biasFactor).value;

            // Assert
            expect(nextInt).not.toHaveBeenCalled();
            expect(g).toBe(warbs[0].expectedValue);
          }
        )
      ));

    it('should increment received depth context when going deeper in the generate-tree then reset it', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          fc.nat(),
          (validInputs, constraints, biasFactor, initialDepth, generateSeed) => {
            // Arrange
            let calledOnce = false;
            const warbs = fromValidInputs(validInputs);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockImplementation((a = 0, b = 0) => a + (generateSeed % (b - a + 1)));
            const depthContext = { depth: initialDepth };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);
            for (const { arbitraryMeta, expectedValue } of warbs) {
              arbitraryMeta.generate.mockReset();
              arbitraryMeta.generate.mockImplementation(() => {
                calledOnce = true;
                expect(depthContext).toEqual({ depth: initialDepth + 1 });
                return new NextValue(expectedValue, undefined);
              });
            }

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            arb.generate(mrng, biasFactor);

            // Assert
            expect(calledOnce).toBe(true);
            expect(depthContext).toEqual({ depth: initialDepth });
          }
        )
      ));

    it('should ask ranges containing negative values as we go deeper in the structure if depthFactor and first arbitrary has weight >0', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ forbidden: ['maxDepth'], required: ['depthFactor'] }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (validInputs, constraints, biasFactor) => {
            // Arrange
            const warbs = fromValidInputs(validInputs);
            fc.pre(warbs[0].weight > 0);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockReturnValue(0);
            const depthContext = { depth: 0 };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValueOnce(depthContext);

            // Act / Assert
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            let currentDepth = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              depthContext.depth = currentDepth;
              arb.generate(mrng, biasFactor);
              expect(depthContext.depth).toBe(currentDepth); // ensures the depth was properly reset
              if (nextInt.mock.calls[nextInt.mock.calls.length - 1][0] < 0) {
                break; // we have been called with a negative value once
              }
              ++currentDepth;
            }
            // first run (depth=0) will always call us with 0->?
            // subsequent calls (depth>0) may call us with negative boundaries
            expect(nextInt).toHaveBeenCalledWith(0, expect.any(Number));
            // but all the runs will call us with the same max
            const distinctMax = new Set(nextInt.mock.calls.map(([_min, max]) => max));
            expect([...distinctMax]).toHaveLength(1);
            const distinctMin = new Set(nextInt.mock.calls.map(([min, _max]) => min));
            expect([...distinctMin]).toHaveLength(2);
          }
        )
      ));

    it('should never ask ranges containing negative values as we go deeper in the structure if first arbitrary has weight of zero', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ forbidden: ['maxDepth'], required: ['depthFactor'] }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (validInputs, constraints, biasFactor) => {
            // Arrange
            const warbs = fromValidInputs(validInputs);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockReturnValue(0);
            const depthContext = { depth: 0 };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValueOnce(depthContext);

            // Act / Assert
            const arb = FrequencyArbitrary.from([{ ...warbs[0], weight: 0 }, ...warbs], constraints, 'test');
            for (let currentDepth = 0; currentDepth !== 100; ++currentDepth) {
              depthContext.depth = currentDepth;
              arb.generate(mrng, biasFactor);
              expect(depthContext.depth).toBe(currentDepth); // ensures the depth was properly reset
            }
            const distinctMin = new Set(nextInt.mock.calls.map(([min, _max]) => min));
            expect([...distinctMin]).toHaveLength(1);
            const distinctMax = new Set(nextInt.mock.calls.map(([_min, max]) => max));
            expect([...distinctMax]).toHaveLength(1);
          }
        )
      ));
  });

  describe('canShrinkWithoutContext', () => {
    it('should tell it cannot generate the value if no sub-arbitrary can generate the value', () =>
      fc.assert(
        fc.property(frequencyValidInputsArb, frequencyConstraintsArbFor({}), (validInputs, constraints) => {
          // Arrange
          const warbs = fromValidInputs(validInputs);
          const depthContext = { depth: 0 };
          const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
          getDepthContextFor.mockReturnValue(depthContext);
          const value = Symbol();
          for (const input of warbs) {
            input.arbitraryMeta.canShrinkWithoutContext.mockReturnValue(false);
          }

          // Act
          const arb = FrequencyArbitrary.from(warbs, constraints, 'test');

          // Assert
          expect(arb.canShrinkWithoutContext(value)).toBe(false);
        })
      ));

    it('should ignore arbitraries with weight of zero when maxDepth not reached', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.nat(),
          (validInputs, constraints, position) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs([
              ...validInputs.slice(0, position % validInputs.length),
              { arbitraryValue: -1, weight: 0 },
              ...validInputs.slice(position % validInputs.length),
            ]);
            const depthContext = { depth: 0 };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);
            const value = Symbol();
            for (const input of warbs) {
              input.arbitraryMeta.canShrinkWithoutContext.mockReturnValue(false);
            }
            warbs[position % validInputs.length].arbitraryMeta.canShrinkWithoutContext.mockReturnValue(true);

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');

            // Assert
            expect(arb.canShrinkWithoutContext(value)).toBe(false);
          }
        )
      ));

    it('should tell it can generate the value if one of the sub-arbitraries can generate the value (maxDepth not reached)', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.nat(),
          (validInputs, constraints, mod) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const depthContext = { depth: 0 };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);
            const value = Symbol();
            const selectedIndex = mod % warbs.length;
            for (let index = 0; index !== warbs.length; ++index) {
              const input = warbs[index];
              const can = index === selectedIndex;
              input.arbitraryMeta.canShrinkWithoutContext.mockReturnValue(can);
            }

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');

            // Assert
            expect(arb.canShrinkWithoutContext(value)).toBe(true);
            expect(warbs[selectedIndex].arbitraryMeta.canShrinkWithoutContext).toHaveBeenCalledWith(value);
          }
        )
      ));

    it('should only consider the first arbitrary when maxDepth has been reached', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ required: ['maxDepth'] }),
          fc.nat(),
          fc.boolean(),
          fc.boolean(),
          (validInputs, constraints, overflowFromMaxDepth, firstCanOrNot, allOthersCanOrNot) => {
            // Arrange
            const warbs = fromValidInputs(validInputs);
            const maxDepth = constraints.maxDepth!;
            const depthContext = { depth: maxDepth + overflowFromMaxDepth };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);
            const value = Symbol();
            for (let index = 0; index !== warbs.length; ++index) {
              warbs[index].arbitraryMeta.canShrinkWithoutContext.mockReturnValue(
                index === 0 ? firstCanOrNot : allOthersCanOrNot
              );
            }

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');

            // Assert
            expect(arb.canShrinkWithoutContext(value)).toBe(firstCanOrNot);
            expect(warbs[0].arbitraryMeta.canShrinkWithoutContext).toHaveBeenCalledWith(value);
            for (let index = 1; index < warbs.length; ++index) {
              expect(warbs[index].arbitraryMeta.canShrinkWithoutContext).not.toHaveBeenCalled();
            }
          }
        )
      ));
  });

  describe('shrink', () => {
    it('should call the right arbitrary to shrink a value generated by itself', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ forbidden: ['withCrossShrink'] }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          fc.nat(),
          (validInputs, constraints, biasFactor, arbitrarySelectionSeed, generateSeed) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const selectedArbitraryIndex = arbitrarySelectionSeed % warbs.length;
            const selectedArbitrary = warbs[selectedArbitraryIndex];
            fc.pre(selectedArbitrary.weight > 0);

            const totalWeightBefore = warbs.slice(0, selectedArbitraryIndex).reduce((acc, cur) => acc + cur.weight, 0);
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockImplementation(() => totalWeightBefore + (generateSeed % selectedArbitrary.weight));
            selectedArbitrary.arbitraryMeta.shrink.mockReturnValue(
              Stream.of(new NextValue(1, undefined), new NextValue(42, undefined))
            );

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const value = arb.generate(mrng, biasFactor);
            const shrinks = [...arb.shrink(value.value, value.context)];

            // Assert
            expect(shrinks.map((v) => v.value)).toEqual([1, 42]);
            expect(selectedArbitrary.arbitraryMeta.shrink).toHaveBeenCalledTimes(1);
            expect(selectedArbitrary.arbitraryMeta.shrink).toHaveBeenCalledWith(
              value.value,
              selectedArbitrary.expectedContext
            );
          }
        )
      ));

    it('should generate a new value using first arbitrary when cross-shrink enabled', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ forbidden: ['withCrossShrink'] }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          fc.nat(),
          (validInputs, constraints, biasFactor, arbitrarySelectionSeed, generateSeed) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const selectedArbitraryIndex = arbitrarySelectionSeed % warbs.length;
            const selectedArbitrary = warbs[selectedArbitraryIndex];
            fc.pre(selectedArbitrary.weight > 0);
            fc.pre(warbs[0].weight > 0);
            fc.pre(selectedArbitraryIndex !== 0);

            const totalWeightBefore = warbs.slice(0, selectedArbitraryIndex).reduce((acc, cur) => acc + cur.weight, 0);
            const { instance: mrng, nextInt, clone } = fakeRandom();
            const { instance: anotherMrng } = fakeRandom();
            clone.mockReturnValue(anotherMrng);
            nextInt.mockImplementation(() => totalWeightBefore + (generateSeed % selectedArbitrary.weight));
            selectedArbitrary.arbitraryMeta.shrink.mockReturnValue(
              Stream.of(new NextValue(1, undefined), new NextValue(42, undefined))
            );

            // Act
            const arb = FrequencyArbitrary.from(warbs, { ...constraints, withCrossShrink: true }, 'test');
            const value = arb.generate(mrng, biasFactor);
            const shrinks = [...arb.shrink(value.value, value.context)];

            // Assert
            expect(shrinks.map((v) => v.value)).toEqual([warbs[0].expectedValue, 1, 42]);
            expect(warbs[0].arbitraryMeta.generate).toHaveBeenCalledWith(anotherMrng, biasFactor);
            expect(selectedArbitrary.arbitraryMeta.shrink).toHaveBeenCalledTimes(1);
            expect(selectedArbitrary.arbitraryMeta.shrink).toHaveBeenCalledWith(
              value.value,
              selectedArbitrary.expectedContext
            );
          }
        )
      ));

    it('should not call generate on first arbitrary when cross-shrink enabled and first generate already used it', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({ forbidden: ['withCrossShrink'] }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          (validInputs, constraints, biasFactor) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            fc.pre(warbs[0].weight > 0);

            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockReturnValue(0);
            warbs[0].arbitraryMeta.shrink.mockReturnValue(
              Stream.of(new NextValue(1, undefined), new NextValue(42, undefined))
            );

            // Act
            const arb = FrequencyArbitrary.from(warbs, { ...constraints, withCrossShrink: true }, 'test');
            const value = arb.generate(mrng, biasFactor);
            const shrinks = [...arb.shrink(value.value, value.context)];

            // Assert
            expect(shrinks.map((v) => v.value)).toEqual([1, 42]);
            expect(warbs[0].arbitraryMeta.shrink).toHaveBeenCalledTimes(1);
            expect(warbs[0].arbitraryMeta.shrink).toHaveBeenCalledWith(value.value, warbs[0].expectedContext);
          }
        )
      ));

    it('should be able to shrink without context if one of the sub-arbitrary can generate the value', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.nat(),
          (validInputs, constraints, mod) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const depthContext = { depth: 0 };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);
            const value = Symbol();
            const selectedIndex = mod % warbs.length;
            fc.pre(warbs[selectedIndex].weight !== 0);
            for (let index = 0; index !== warbs.length; ++index) {
              const input = warbs[index];
              const can = index === selectedIndex;
              input.arbitraryMeta.canShrinkWithoutContext.mockReturnValue(can);
              input.arbitraryMeta.shrink.mockReturnValue(
                Stream.of(new NextValue(42, undefined), new NextValue(index, undefined))
              );
            }

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const shrinks = [...arb.shrink(value as any, undefined)];

            // Assert
            expect(shrinks.map((v) => v.value)).toEqual([42, selectedIndex]);
            expect(warbs[selectedIndex].arbitraryMeta.canShrinkWithoutContext).toHaveBeenCalledWith(value);
            expect(warbs[selectedIndex].arbitraryMeta.shrink).toHaveBeenCalledWith(value, undefined);
          }
        )
      ));

    it('should be able to shrink without context if one of the sub-arbitrary can generate the value plus prepend fallback of first (whenever possible)', () =>
      fc.assert(
        fc.property(
          frequencyValidInputsArb,
          frequencyConstraintsArbFor({}),
          fc.nat(),
          (validInputs, constraints, mod) => {
            // Arrange
            fc.pre(constraints.maxDepth !== 0);
            const warbs = fromValidInputs(validInputs);
            const depthContext = { depth: 0 };
            const getDepthContextFor = jest.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);
            const value = Symbol();
            const selectedIndex = mod % warbs.length;
            fc.pre(warbs[selectedIndex].weight !== 0);
            for (let index = 0; index !== warbs.length; ++index) {
              const input = warbs[index];
              const can = index === selectedIndex;
              input.arbitraryMeta.canShrinkWithoutContext.mockReturnValue(can);
              input.arbitraryMeta.shrink.mockReturnValue(
                Stream.of(new NextValue(42, undefined), new NextValue(index, undefined))
              );
            }
            warbs[0].fallbackValue = { default: 48 };

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const shrinks = [...arb.shrink(value as any, undefined)];

            // Assert
            if (warbs[0].weight !== 0 && selectedIndex !== 0 && constraints.withCrossShrink) {
              // Can only prepend when applicable ie:
              // - weight of [0] >0
              // - not shrinking a value coming from [0]
              // - cross-shrink enabled
              expect(shrinks.map((v) => v.value)).toEqual([48, 42, selectedIndex]);
            } else {
              expect(shrinks.map((v) => v.value)).toEqual([42, selectedIndex]);
            }
            expect(warbs[selectedIndex].arbitraryMeta.canShrinkWithoutContext).toHaveBeenCalledWith(value);
            expect(warbs[selectedIndex].arbitraryMeta.shrink).toHaveBeenCalledWith(value, undefined);
          }
        )
      ));
  });
});

describe('FrequencyArbitrary (integration)', () => {
  type Extra = { data: { offset: number; weight: number }[]; constraints: Partial<_Constraints> };
  const maxRangeLength = 10;
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      data: fc
        .array(
          fc.record(
            {
              offset: fc.nat(),
              weight: fc.nat(),
            },
            { requiredKeys: ['offset', 'weight'] }
          ),
          { minLength: 1 }
        )
        .filter((inputs) => inputs.reduce((summedWeight, current) => summedWeight + current.weight, 0) > 0),
      constraints: fc.record(
        {
          withCrossShrink: fc.boolean(),
          depthFactor: fc.double({ min: 0, max: Number.MAX_VALUE, noNaN: true }),
          maxDepth: fc.nat(),
        },
        { requiredKeys: [] }
      ),
    },
    { requiredKeys: ['data', 'constraints'] }
  );

  const isCorrect = (value: number, extra: Extra) =>
    typeof value === 'number' && extra.data.some((m) => m.offset <= value && value <= m.offset + maxRangeLength);

  const isStrictlySmaller = (v1: number, v2: number, extra: Extra) => {
    // When withCrossShrink is toggled, the shrinker can jump from one arbitrary to the first one on shrink
    // But only if the weight associated to the first arbitrary is strictly greater than 0
    if (extra.constraints.withCrossShrink && extra.data[0].weight > 0) {
      const canBeInFirstArbitrary = extra.data[0].offset <= v1 && v1 <= extra.data[0].offset + maxRangeLength;
      if (canBeInFirstArbitrary) {
        // `v1` is possibly coming from our first arbitrary
        return true;
      }
    }
    return Math.abs(v1) < Math.abs(v2);
  };

  const frequencyBuilder = (extra: Extra) =>
    FrequencyArbitrary.from(
      extra.data.map((m) => ({ weight: m.weight, arbitrary: new FakeIntegerArbitrary(m.offset, maxRangeLength) })),
      extra.constraints,
      'test'
    );

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(frequencyBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(frequencyBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(frequencyBuilder, { extraParameters });
  });

  it('should shrink towards strictly smaller values (if underlyings do)', () => {
    assertShrinkProducesStrictlySmallerValue(frequencyBuilder, isStrictlySmaller, { extraParameters });
  });
});
