import { sparseArray, SparseArrayConstraints } from '../../../../src/check/arbitrary/SparseArrayArbitrary';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { mocked } from 'ts-jest/utils';

import fc from '../../../../lib/fast-check';

import * as NatMock from '../../../../src/arbitrary/nat';
import * as SetMock from '../../../../src/arbitrary/set';
import * as TupleMock from '../../../../src/arbitrary/tuple';
import { arbitraryFor } from './generic/ArbitraryBuilder';
jest.mock('../../../../src/arbitrary/nat');
jest.mock('../../../../src/arbitrary/set');
jest.mock('../../../../src/arbitrary/tuple');

const validSparseArrayConstraints = (removedKeys: (keyof SparseArrayConstraints)[] = []) =>
  fc
    .record(
      {
        maxLength: removedKeys.includes('maxLength') ? fc.constant(undefined) : fc.nat(),
        minNumElements: removedKeys.includes('minNumElements') ? fc.constant(undefined) : fc.nat(),
        maxNumElements: removedKeys.includes('maxNumElements') ? fc.constant(undefined) : fc.nat(),
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

function isLimitNoTrailingCase(ct?: SparseArrayConstraints): boolean {
  // In that precise case the only solution is a simple constant equal to []
  return ct !== undefined && !!ct.noTrailingHole && ct.maxLength === 0;
}

class FakeArbitrary extends Arbitrary<unknown> {
  generate(): Shrinkable<unknown, unknown> {
    throw new Error('Method not implemented.');
  }
}

const beforeEachFunction = () => {
  jest.clearAllMocks();
};

describe('SparseArrayArbitrary', () => {
  describe('sparseArray', () => {
    beforeEach(beforeEachFunction);
    it('Should always specify a minLength and maxLength on the underlying set', () => {
      fc.assert(
        fc
          .property(fc.option(validSparseArrayConstraints(), { nil: undefined }), (ct) => {
            // Arrange
            fc.pre(!isLimitNoTrailingCase(ct));
            const { set } = mocked(SetMock);
            const { tuple } = mocked(TupleMock);
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
          .property(fc.option(validSparseArrayConstraints(), { nil: undefined }), (ct) => {
            // Arrange
            fc.pre(!isLimitNoTrailingCase(ct));
            const { set } = mocked(SetMock);
            const { tuple } = mocked(TupleMock);
            const { nat } = mocked(NatMock); // called to build indexes
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

    it('Should reject constraints having minNumElements > maxLength', () => {
      fc.assert(
        fc.property(
          validSparseArrayConstraints(['minNumElements', 'maxLength']),
          fc.nat(4294967295),
          fc.nat(4294967295),
          (draftCt, a, b) => {
            // Arrange
            fc.pre(a !== b);
            const ct = { ...draftCt, minNumElements: a > b ? a : b, maxLength: a > b ? b : a };
            const arb = new FakeArbitrary();

            // Act / Assert
            expect(() => sparseArray(arb, ct)).toThrowError(/non-hole/);
          }
        )
      );
    });

    it('Should reject constraints having minNumElements > maxNumElements', () => {
      fc.assert(
        fc.property(
          validSparseArrayConstraints(['minNumElements', 'maxNumElements']),
          fc.nat(4294967295),
          fc.nat(4294967295),
          (draftCt, a, b) => {
            // Arrange
            fc.pre(a !== b);
            const ct = { ...draftCt, minNumElements: a > b ? a : b, maxNumElements: a > b ? b : a };
            const arb = new FakeArbitrary();

            // Act / Assert
            expect(() => sparseArray(arb, ct)).toThrowError(/non-hole/);
          }
        )
      );
    });
  });
});
