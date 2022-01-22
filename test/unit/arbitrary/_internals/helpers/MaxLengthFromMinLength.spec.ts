import { assert } from 'console';
import fc from '../../../../../lib/fast-check';
import {
  DefaultSize,
  maxGeneratedLengthFromSizeForArbitrary,
  maxLengthFromMinLength,
  MaxLengthUpperBound,
  RelativeSize,
  relativeSizeToSize,
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

  it('should behave as its equivalent Size taking into account global settings when receiving a RelativeSize', () => {
    fc.assert(
      fc.property(
        relativeSizeArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (size, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const equivalentSize = relativeSizeToSize(size, DefaultSize);
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength);
          const expectedLength = maxGeneratedLengthFromSizeForArbitrary(
            equivalentSize,
            minLength,
            maxLength,
            specifiedMaxLength
          );

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should only consider the received maxLength when set to "max"', () => {
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

describe('relativeSizeToSize', () => {
  it('should offset by -4 when "-4"', () => {
    const relativeSize = '-4';
    expect(relativeSizeToSize(relativeSize, 'xsmall')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'small')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'medium')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'large')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'xlarge')).toBe('xsmall');
  });

  it('should offset by -1 when "-1"', () => {
    const relativeSize = '-1';
    expect(relativeSizeToSize(relativeSize, 'xsmall')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'small')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'medium')).toBe('small');
    expect(relativeSizeToSize(relativeSize, 'large')).toBe('medium');
    expect(relativeSizeToSize(relativeSize, 'xlarge')).toBe('large');
  });

  it('should not offset when "="', () => {
    const relativeSize = '=';
    expect(relativeSizeToSize(relativeSize, 'xsmall')).toBe('xsmall');
    expect(relativeSizeToSize(relativeSize, 'small')).toBe('small');
    expect(relativeSizeToSize(relativeSize, 'medium')).toBe('medium');
    expect(relativeSizeToSize(relativeSize, 'large')).toBe('large');
    expect(relativeSizeToSize(relativeSize, 'xlarge')).toBe('xlarge');
  });

  it('should offset by +1 when "+1"', () => {
    const relativeSize = '+1';
    expect(relativeSizeToSize(relativeSize, 'xsmall')).toBe('small');
    expect(relativeSizeToSize(relativeSize, 'small')).toBe('medium');
    expect(relativeSizeToSize(relativeSize, 'medium')).toBe('large');
    expect(relativeSizeToSize(relativeSize, 'large')).toBe('xlarge');
    expect(relativeSizeToSize(relativeSize, 'xlarge')).toBe('xlarge');
  });

  it('should offset by +4 when "+4"', () => {
    const relativeSize = '+4';
    expect(relativeSizeToSize(relativeSize, 'xsmall')).toBe('xlarge');
    expect(relativeSizeToSize(relativeSize, 'small')).toBe('xlarge');
    expect(relativeSizeToSize(relativeSize, 'medium')).toBe('xlarge');
    expect(relativeSizeToSize(relativeSize, 'large')).toBe('xlarge');
    expect(relativeSizeToSize(relativeSize, 'xlarge')).toBe('xlarge');
  });
});

// Helpers

const allSizeOrdered = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
const sizeArb = fc.constantFrom<Size>(...allSizeOrdered);
const isSmallerSize = (sa: Size, sb: Size) => allSizeOrdered.indexOf(sa) < allSizeOrdered.indexOf(sb);

const allRelativeSize = ['-4', '-3', '-2', '-1', '=', '+1', '+2', '+3', '+4'] as const;
const relativeSizeArb = fc.constantFrom<RelativeSize>(...allRelativeSize);

const allSizeForArbitrary = [...allSizeOrdered, ...allRelativeSize, 'max'] as const; // WARNING: it does not include undefined
const sizeForArbitraryArb = fc.constantFrom<SizeForArbitrary>(...allSizeForArbitrary);

// Type check that helpers are covering all the possibilities

const failIfMissingSize: Size extends typeof allSizeOrdered[number] ? true : never = true;
const failIfMissingRelativeSize: RelativeSize extends typeof allRelativeSize[number] ? true : never = true;
const failIfMissingSizeForArbitrary: NonNullable<SizeForArbitrary> extends typeof allSizeForArbitrary[number]
  ? true
  : never = true;
assert(failIfMissingSize); // just not to appear unused
assert(failIfMissingRelativeSize); // just not to appear unused
assert(failIfMissingSizeForArbitrary); // just not to appear unused
