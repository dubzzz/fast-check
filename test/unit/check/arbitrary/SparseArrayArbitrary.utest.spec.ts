import { sparseArray } from '../../../../src/check/arbitrary/SparseArrayArbitrary';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { mocked } from 'ts-jest/utils';

import fc from '../../../../lib/fast-check';

import * as IntegerArbitraryMock from '../../../../src/check/arbitrary/IntegerArbitrary';
import * as SetArbitraryMock from '../../../../src/check/arbitrary/SetArbitrary';
import * as TupleArbitraryMock from '../../../../src/check/arbitrary/TupleArbitrary';
import { arbitraryFor } from './generic/ArbitraryBuilder';
jest.mock('../../../../src/check/arbitrary/IntegerArbitrary');
jest.mock('../../../../src/check/arbitrary/SetArbitrary');
jest.mock('../../../../src/check/arbitrary/TupleArbitrary');

const beforeEachFunction = () => {
  jest.clearAllMocks();
};

describe('SparseArrayArbitrary', () => {
  describe('sparseArray', () => {
    beforeEach(beforeEachFunction);
    it('Should always specify a minLength and maxLength on the underlying set', () => {
      fc.assert(
        fc
          .property(fc.option(validSparseArrayConstraints, { nil: undefined }), (ct) => {
            // Arrange
            const { set } = mocked(SetArbitraryMock);
            const { tuple } = mocked(TupleArbitraryMock);
            set.mockImplementationOnce(() => arbitraryFor([{ value: [] }]));
            tuple.mockImplementationOnce(() => arbitraryFor([{ value: [] as any }]));

            const arb = new FakeArbitrary();

            // Act
            sparseArray(arb, ct);

            // Assert
            expect(set).toHaveBeenCalledTimes(1);
            expect(set).toHaveBeenCalledWith(
              expect.anything(),
              expect.objectContaining({ minLength: expect.any(Number), maxLength: expect.any(Number) })
            );
          })
          .beforeEach(beforeEachFunction)
      );
    });

    it('Should always pass a not too large maxLength to set given the length we expect at the end', () => {
      fc.assert(
        fc
          .property(fc.option(validSparseArrayConstraints, { nil: undefined }), (ct) => {
            // Arrange
            const { set } = mocked(SetArbitraryMock);
            const { tuple } = mocked(TupleArbitraryMock);
            const { nat } = mocked(IntegerArbitraryMock); // called to build indexes
            set.mockImplementationOnce(() => arbitraryFor([{ value: [] }]));
            tuple.mockImplementationOnce(() => arbitraryFor([{ value: [] as any }]));

            const arb = new FakeArbitrary();

            // Act
            sparseArray(arb, ct);

            // Assert
            expect(nat).toHaveBeenCalledTimes(1);
            expect(set).toHaveBeenCalledTimes(1);
            const maxRequestedIndexes = nat.mock.calls[0][0] as number;
            const maxRequestedLength = set.mock.calls[0][1].maxLength!;
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
          })
          .beforeEach(beforeEachFunction)
      );
    });
  });
});

// Helpers

const validSparseArrayConstraints = fc
  .record(
    {
      maxLength: fc.nat(),
      minNumElements: fc.nat(),
      maxNumElements: fc.nat(),
      noTrailingHole: fc.boolean(),
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

class FakeArbitrary extends Arbitrary<unknown> {
  generate(): Shrinkable<unknown, unknown> {
    throw new Error('Method not implemented.');
  }
}
