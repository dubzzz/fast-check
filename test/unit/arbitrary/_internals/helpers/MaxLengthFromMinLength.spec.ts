import fc from '../../../../../lib/fast-check';
import {
  DefaultSize,
  maxGeneratedLengthFromSizeForArbitrary,
  maxLengthFromMinLength,
  MaxLengthUpperBound,
  Size,
  SizeForArbitrary,
} from '../../../../../src/arbitrary/_internals/helpers/MaxLengthFromMinLength';

describe('maxLengthFromMinLength', () => {
  it('should result into higher or equal maxLength given higher size', () => {
    fc.assert(
      fc.property(sizeArb, sizeArb, fc.integer({ min: 0, max: MaxLengthUpperBound }), (sa, sb, minLength) => {
        // Arrange
        const [smallSize, largeSize] = isSmallerSize(sa, sb) ? [sa, sb] : [sb, sa];

        // Act / Assert
        expect(maxLengthFromMinLength(minLength, smallSize)).toBeLessThanOrEqual(
          maxLengthFromMinLength(minLength, largeSize)
        );
      })
    );
  });

  it('should result into higher or equal maxLength given higher minLength', () => {
    fc.assert(
      fc.property(
        sizeArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (size, minLengthA, minLengthB) => {
          // Arrange
          const [smallMinLength, largeMinLength] =
            minLengthA < minLengthB ? [minLengthA, minLengthB] : [minLengthB, minLengthA];

          // Act / Assert
          expect(maxLengthFromMinLength(smallMinLength, size)).toBeLessThanOrEqual(
            maxLengthFromMinLength(largeMinLength, size)
          );
        }
      )
    );
  });
});

describe('maxGeneratedLengthFromSizeForArbitrary', () => {
  it('should only consider the received size when set to Size', () => {
    fc.assert(
      fc.property(
        sizeArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (size, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength);
          const expectedLength = maxLengthFromMinLength(minLength, size);

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should only consider the received size when set to "max"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const size = 'max';
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength);

          // Assert
          expect(computedLength).toBe(maxLength);
        }
      )
    );
  });

  it('should ignore specifiedMaxLength whenever size specified', () => {
    fc.assert(
      fc.property(
        sizeForArbitraryArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (size, lengthA, lengthB) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, false);
          const expectedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, true);

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should fallback to "max" whenever no size specified but maxLength specified', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (lengthA, lengthB) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(undefined, minLength, maxLength, true);
          const expectedLength = maxGeneratedLengthFromSizeForArbitrary('max', minLength, maxLength, true);

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should fallback to DefaultSize whenever no size specified and no maxLength specified', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (lengthA, lengthB) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(undefined, minLength, maxLength, false);
          const expectedLength = maxGeneratedLengthFromSizeForArbitrary(DefaultSize, minLength, maxLength, false);

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });
});

// Helpers

const allSizeOrdered = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
const sizeArb = fc.constantFrom<Size>(...allSizeOrdered);
const isSmallerSize = (sa: Size, sb: Size) => allSizeOrdered.indexOf(sa) < allSizeOrdered.indexOf(sb);

const allSizeForArbitrary = [...allSizeOrdered, 'max'] as const; // WARNING/ it does not include undefined
const sizeForArbitraryArb = fc.constantFrom<SizeForArbitrary>(...allSizeForArbitrary);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const failIfMissingSize: Size extends typeof allSizeOrdered[number] ? true : never = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const failIfMissingSizeForArbitrary: SizeForArbitrary extends typeof allSizeForArbitrary[number] ? true : never = true;
