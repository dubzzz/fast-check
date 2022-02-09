import fc from '../../../../../lib/fast-check';
import {
  DefaultSize,
  maxGeneratedLengthFromSizeForArbitrary,
  maxLengthFromMinLength,
  MaxLengthUpperBound,
  relativeSizeToSize,
  resolveSize,
} from '../../../../../src/arbitrary/_internals/helpers/MaxLengthFromMinLength';
import { configureGlobal, readConfigureGlobal } from '../../../../../src/check/runner/configuration/GlobalParameters';
import { sizeArb, isSmallerSize, relativeSizeArb, sizeForArbitraryArb } from '../../__test-helpers__/SizeHelpers';

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
          const expectedLength = Math.min(maxLengthFromMinLength(minLength, size), maxLength);

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

  it('should behave as its resolved Size when in unspecified max mode', () => {
    fc.assert(
      fc.property(
        sizeForArbitraryArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (size, lengthA, lengthB) => {
          // Arrange
          const resolvedSize = resolveSize(size);
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, false);
          const expectedLength = maxGeneratedLengthFromSizeForArbitrary(resolvedSize, minLength, maxLength, false);

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

  it('should always return a length being between minLength and maxLength', () => {
    fc.assert(
      fc.property(
        fc.record({ baseSize: sizeArb, defaultSizeToMaxWhenMaxSpecified: fc.boolean() }, { requiredKeys: [] }),
        fc.option(sizeForArbitraryArb, { nil: undefined }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (config, size, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          let computedLength: number;
          const previousConfiguration = readConfigureGlobal();
          try {
            configureGlobal(config);
            computedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength);
          } finally {
            configureGlobal(previousConfiguration || {});
          }

          // Assert
          expect(computedLength).toBeGreaterThanOrEqual(minLength);
          expect(computedLength).toBeLessThanOrEqual(maxLength);
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
