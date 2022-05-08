/* eslint-disable no-sparse-arrays */
import * as fc from '../../../lib/fast-check';
import { sparseArray, SparseArrayConstraints } from '../../../src/arbitrary/sparseArray';

import {
  FakeIntegerArbitrary,
  fakeNextArbitrary,
  fakeNextArbitraryStaticValue,
} from './__test-helpers__/NextArbitraryHelpers';

import * as RestrictedIntegerArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/RestrictedIntegerArbitraryBuilder';
import * as TupleMock from '../../../src/arbitrary/tuple';
import * as UniqueMock from '../../../src/arbitrary/uniqueArray';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';
import { MaxLengthUpperBound } from '../../../src/arbitrary/_internals/helpers/MaxLengthFromMinLength';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);
fc.configureGlobal({
  ...fc.readConfigureGlobal(),
  beforeEach: beforeEachHook,
});

describe('sparseArray', () => {
  it('should always specify a minLength and maxLength on the underlying set', () => {
    fc.assert(
      fc.property(fc.option(validSparseArrayConstraints(), { nil: undefined }), (ct) => {
        // Arrange
        fc.pre(!isLimitNoTrailingCase(ct));
        const tuple = jest.spyOn(TupleMock, 'tuple');
        const uniqueArray = jest.spyOn(UniqueMock, 'uniqueArray');
        const { instance: tupleInstance } = fakeNextArbitraryStaticValue(() => []);
        const { instance: uniqueInstance } = fakeNextArbitraryStaticValue(() => []);
        tuple.mockReturnValueOnce(tupleInstance);
        uniqueArray.mockReturnValueOnce(uniqueInstance);
        const { instance: arb } = fakeNextArbitrary();

        // Act
        sparseArray(arb, ct);

        // Assert
        expect(uniqueArray).toHaveBeenCalledTimes(1);
        expect(uniqueArray).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ minLength: expect.any(Number), maxLength: expect.any(Number) })
        );
      })
    );
  });

  it('should always pass a not too large maxLength or with a size to set given the length we expect at the end', () => {
    fc.assert(
      fc.property(fc.option(validSparseArrayConstraints(), { nil: undefined }), (ct) => {
        // Arrange
        fc.pre(!isLimitNoTrailingCase(ct));
        const tuple = jest.spyOn(TupleMock, 'tuple');
        const uniqueArray = jest.spyOn(UniqueMock, 'uniqueArray');
        const restrictedIntegerArbitraryBuilder = jest.spyOn(
          RestrictedIntegerArbitraryBuilderMock,
          'restrictedIntegerArbitraryBuilder'
        ); // called to build indexes
        const { instance: tupleInstance } = fakeNextArbitraryStaticValue(() => []);
        const { instance: uniqueArrayInstance } = fakeNextArbitraryStaticValue(() => []);
        tuple.mockReturnValueOnce(tupleInstance);
        uniqueArray.mockReturnValueOnce(uniqueArrayInstance);
        const { instance: arb } = fakeNextArbitrary();

        // Act
        sparseArray(arb, ct);

        // Assert
        expect(restrictedIntegerArbitraryBuilder).toHaveBeenCalled(); // at least once
        expect(uniqueArray).toHaveBeenCalledTimes(1);
        // First call is to configure items coming with data
        const maxGeneratedIndexes = restrictedIntegerArbitraryBuilder.mock.calls[0][1]; // ie maxGenerated
        const maxRequestedIndexes = restrictedIntegerArbitraryBuilder.mock.calls[0][2]; // ie max
        expect(maxGeneratedIndexes).toBeLessThanOrEqual(maxRequestedIndexes);
        const maxRequestedLength = uniqueArray.mock.calls[0][1].maxLength!;
        if (ct !== undefined && ct.noTrailingHole) {
          // maxRequestedIndexes is the maximal index we may have for the current instance (+1 is the length)
          // maxRequestedLength is the maximal number of elements we ask to the set
          const maxElementsToGenerateForArray = maxRequestedLength;
          const maxResultingArrayLength = maxRequestedIndexes + 1;
          expect(maxElementsToGenerateForArray).toBeLessThanOrEqual(maxResultingArrayLength);
        } else {
          // In the default case, for falsy noTrailingHole:
          // - nat will be called with the maximal length allowed for the requested array
          // - set with the maximal number of elements +1
          const maxElementsToGenerateForArray = maxRequestedLength - 1;
          const maxResultingArrayLength = maxRequestedIndexes;
          expect(maxElementsToGenerateForArray).toBeLessThanOrEqual(maxResultingArrayLength);
        }
        // Second call is only to handle the length computation in case we allow trailing holes
        const resultedMinNumElements = ct !== undefined ? ct.minNumElements || 0 : 0;
        const resultedMaxLength = ct !== undefined && ct.maxLength !== undefined ? ct.maxLength : MaxLengthUpperBound;
        if (ct === undefined || (!ct.noTrailingHole && resultedMaxLength > resultedMinNumElements)) {
          expect(restrictedIntegerArbitraryBuilder).toHaveBeenCalledTimes(2);
          const [min, maxGenerated, max] = restrictedIntegerArbitraryBuilder.mock.calls[1];
          expect(min).toBe(resultedMinNumElements);
          expect(maxGenerated).toBe(maxGeneratedIndexes + 1);
          expect(max).toBe(maxRequestedIndexes + 1);
        }
      })
    );
  });

  it('should reject constraints having minNumElements > maxLength', () => {
    fc.assert(
      fc.property(
        validSparseArrayConstraints(['minNumElements', 'maxLength']),
        fc.nat({ max: 4294967295 }),
        fc.nat({ max: 4294967295 }),
        (draftCt, a, b) => {
          // Arrange
          fc.pre(a !== b);
          const ct = { ...draftCt, minNumElements: a > b ? a : b, maxLength: a > b ? b : a };
          const { instance: arb } = fakeNextArbitrary();

          // Act / Assert
          expect(() => sparseArray(arb, ct)).toThrowError(/non-hole/);
        }
      )
    );
  });

  it('should reject constraints having minNumElements > maxNumElements', () => {
    fc.assert(
      fc.property(
        validSparseArrayConstraints(['minNumElements', 'maxNumElements']),
        fc.nat({ max: 4294967295 }),
        fc.nat({ max: 4294967295 }),
        (draftCt, a, b) => {
          // Arrange
          fc.pre(a !== b);
          const ct = { ...draftCt, minNumElements: a > b ? a : b, maxNumElements: a > b ? b : a };
          const { instance: arb } = fakeNextArbitrary();

          // Act / Assert
          expect(() => sparseArray(arb, ct)).toThrowError(/non-hole/);
        }
      )
    );
  });
});

describe('sparseArray (integration)', () => {
  type Extra = SparseArrayConstraints | undefined;

  // Even if full of holes, they still are memory intensive we explicitely
  // limit num elements in order to avoid running our tests for too long
  const extraParameters: fc.Arbitrary<Extra> = fc.option(validSparseArrayConstraints([], 100), { nil: undefined });

  const isEqual = (v1: number[], v2: number[]): boolean => {
    // WARNING: Very long loops in Jest when comparing two very large sparse arrays
    expect(v1.length).toBe(v2.length);
    expect(Object.entries(v1)).toEqual(Object.entries(v2));
    return true;
  };

  const isCorrect = (v: number[], extra: Extra = {}) => {
    // Should be an array
    if (!Array.isArray(v)) return false;
    // Should not have a length greater than the requested one (if any)
    if (extra.maxLength !== undefined && v.length > extra.maxLength) return false;
    // Should contain at least the minimal number of requested items (if specified)
    if (extra.minNumElements !== undefined && Object.keys(v).length < extra.minNumElements) return false;
    // Should contain at most the maxiaml number of requested items (if specified)
    if (extra.maxNumElements !== undefined && Object.keys(v).length > extra.maxNumElements) return false;
    // Should only contain valid keys: numbers within 0 and length-1
    for (const k of Object.keys(v)) {
      const i = Number(k);
      if (Number.isNaN(i) || i < 0 || i >= v.length) return false;
    }
    // Should never end by a hole if user activated noTrailingHole
    if (extra.noTrailingHole && v.length > 0 && !(v.length - 1 in v)) return false;
    // If all the previous checks passed, then array should be ok
    return true;
  };

  const sparseArrayBuilder = (extra: Extra) => sparseArray(new FakeIntegerArbitrary(), extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(sparseArrayBuilder, { extraParameters, isEqual });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(sparseArrayBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    // Remark: It will not shrink towards the exact same values for various reasons,
    // - when noTrailingHole=false, there is no real way to buid back the targetLength
    // - the key-value pairs will most of the time not be in the same ordered as the build order,
    //   thus it will lead to a different shrink order
    assertProduceValuesShrinkableWithoutContext(sparseArrayBuilder, { extraParameters });
  });

  it.each`
    source                                                                 | constraints
    ${['1'] /* unsupported value */}                                       | ${{}}
    ${[1, , , , ,] /* ending by a hole not allowed */}                     | ${{ noTrailingHole: true }}
    ${[, , , , , 3, , , , , , , , , , 6] /* not enough non-holey items */} | ${{ minNumElements: 3 }}
    ${[, , , , , 3, 4, , , 5, , , , , , 6] /* too many non-holey items */} | ${{ maxNumElements: 3 }}
    ${[, , , 4] /* too long (length is 4) */}                              | ${{ maxLength: 3 }}
  `('should not be able to generate $source with fc.sparseArray(..., $constraints)', ({ source, constraints }) => {
    // Arrange / Act
    const arb = sparseArray(new FakeIntegerArbitrary(), constraints);
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue                                                                                                          | constraints
    ${[1, , , , ,]}                                                                                                   | ${{ noTrailingHole: false }}
    ${[, , , , , 3, , , , , , , , , , 6]}                                                                             | ${{ minNumElements: 2 }}
    ${[, , , , , 3, 4, , , 5, , , , , , 6]}                                                                           | ${{ maxNumElements: 4 }}
    ${[, , , 4]}                                                                                                      | ${{ maxLength: 4 }}
    ${Object.assign(Array(200), { 1: 7 }) /* length longer than default maxGeneratedLength but ok for shrink */}      | ${{}}
    ${[...Array(50)].map((_, i) => i) /* non-holey items higher than default maxGeneratedLength but ok for shrink */} | ${{}}
  `('should be able to shrink $rawValue with fc.sparseArray(..., $constraints)', ({ rawValue, constraints }) => {
    // Arrange
    const arb = sparseArray(new FakeIntegerArbitrary(), constraints);
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

function validSparseArrayConstraints(
  removedKeys: (keyof SparseArrayConstraints)[] = [],
  max: number | undefined = undefined
) {
  return fc
    .record(
      {
        maxLength: removedKeys.includes('maxLength') ? fc.constant(undefined) : fc.nat({ max }),
        minNumElements: removedKeys.includes('minNumElements')
          ? fc.constant(undefined)
          : fc.nat({ max: max !== undefined ? Math.min(5, max) : undefined }),
        maxNumElements: removedKeys.includes('maxNumElements') ? fc.constant(undefined) : fc.nat({ max }),
        noTrailingHole: removedKeys.includes('noTrailingHole') ? fc.constant(undefined) : fc.boolean(),
      },
      { requiredKeys: [] }
    )
    .map((ct) => {
      // We use map there in order not to filter on generated values
      if (ct.minNumElements !== undefined && ct.maxNumElements !== undefined && ct.minNumElements > ct.maxNumElements) {
        return { ...ct, minNumElements: ct.maxNumElements, maxNumElements: ct.minNumElements };
      }
      return ct;
    })
    .map((ct) => {
      // We use map there in order not to filter on generated values
      if (ct.minNumElements !== undefined && ct.maxLength !== undefined && ct.minNumElements > ct.maxLength) {
        return { ...ct, minNumElements: ct.maxLength, maxLength: ct.minNumElements };
      }
      return ct;
    });
}

function isLimitNoTrailingCase(ct?: SparseArrayConstraints): boolean {
  // In that precise case the only solution is a simple constant equal to []
  return ct !== undefined && !!ct.noTrailingHole && ct.maxLength === 0;
}
