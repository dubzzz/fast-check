import { beforeEach, describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { _Constraints } from '../../../../src/arbitrary/_internals/FrequencyArbitrary.js';
import { FrequencyArbitrary } from '../../../../src/arbitrary/_internals/FrequencyArbitrary.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers.js';
import * as DepthContextMock from '../../../../src/arbitrary/_internals/helpers/DepthContext.js';
import { sizeArb } from '../__test-helpers__/SizeHelpers.js';

function beforeEachHook() {
  vi.restoreAllMocks();
}
// No need to restore hook between each execution of fast-check
// the hooks will be resetted within the tests themselves if needed
//  >  fc.configureGlobal({ beforeEach: beforeEachHook });
beforeEach(beforeEachHook);
fc.configureGlobal({ beforeEach: beforeEachHook });

const frequencyValidInputsArb = fc
  .tuple(
    fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() }),
    fc.array(fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() })),
    fc.array(fc.record({ weight: fc.integer({ min: 1 }), arbitraryValue: fc.integer() })),
  )
  .map(([positiveWeightMeta, headingWeightsMeta, traillingWeightsMeta]) => [
    ...headingWeightsMeta,
    positiveWeightMeta,
    ...traillingWeightsMeta,
  ]);

const fromValidInputs = (metas: { weight: number; arbitraryValue: number }[]) =>
  metas.map((meta) => {
    const expectedContext = Symbol();
    const arbitraryMeta = fakeArbitrary<number>();
    arbitraryMeta.generate.mockReturnValue(new Value(meta.arbitraryValue, expectedContext));
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
      ...(!forbidden.includes('depthSize')
        ? { depthSize: fc.oneof(fc.double({ min: 0, max: 100, noNaN: true }), sizeArb) }
        : {}),
      ...(!forbidden.includes('maxDepth') ? { maxDepth: fc.nat() } : {}),
      ...(!forbidden.includes('withCrossShrink') ? { withCrossShrink: fc.boolean() } : {}),
    },
    { requiredKeys: required },
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
            const getDepthContextFor = vi.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');

            // Assert
            expect(arb).toBeInstanceOf(FrequencyArbitrary);
          },
        ),
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
            const getDepthContextFor = vi.spyOn(DepthContextMock, 'getDepthContextFor');
            getDepthContextFor.mockReturnValue(depthContext);

            // Act
            const arb = FrequencyArbitrary.from(warbs, constraints, 'test');
            const typedArb = arb as FrequencyArbitrary<number>;

            // Assert
            expect(getDepthContextFor).toHaveBeenCalledTimes(1);
            expect(getDepthContextFor).toHaveBeenCalledWith(constraints.depthIdentifier);
            expect(typedArb.context).toBe(depthContext);
          },
        ),
      ));

    it('should reject calls without any weighted arbitraries', () => {
      // Arrange / Act / Assert
      expect(() => FrequencyArbitrary.from([], {}, 'test')).toThrowError();
    });

    it('should reject calls without weight', () => {
      // Arrange / Act / Assert
      expect(() =>
        FrequencyArbitrary.from([{ arbitrary: fakeArbitrary(), weight: undefined! }], {}, 'test'),
      ).toThrowError(/expects weights to be integer values/);
    });

    it('should reject calls without arbitrary', () => {
      // Arrange / Act / Assert
      expect(() => FrequencyArbitrary.from([{ arbitrary: undefined!, weight: 1 }], {}, 'test')).toThrowError(
        /expects arbitraries to be specified/,
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
              arbitrary: fakeArbitrary(),
            }));

            // Act / Assert
            expect(() => FrequencyArbitrary.from(weightedArbs, {}, 'test')).toThrowError();
          },
        ),
      ));

    // This test does not pass even alone
    it('should reject calls having a total weight of zero', () =>
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), (numEntries) => {
          // Arrange
          const weightedArbs = [...Array(numEntries)].map(() => ({
            weight: 0,
            arbitrary: fakeArbitrary(),
          }));

          // Act / Assert
          // Combined with: 'Should reject calls including at one strictly negative weight'
          // it means that we have: 'Should reject calls having a total weight inferior or equal to zero'
          expect(() => FrequencyArbitrary.from(weightedArbs, {}, 'test')).toThrowError();
        }),
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
              arbitrary: fakeArbitrary(),
            }));

            // Act / Assert
            expect(() => FrequencyArbitrary.from(weightedArbs, {}, 'test')).not.toThrowError();
          },
        ),
      ));
  });
});
