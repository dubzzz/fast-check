import fc from '../../../../../lib/fast-check';
import {
  DefaultSize,
  maxGeneratedLengthFromSizeForArbitrary,
  maxLengthFromMinLength,
  MaxLengthUpperBound,
  relativeSizeToSize,
} from '../../../../../src/arbitrary/_internals/helpers/MaxLengthFromMinLength';
import { withConfiguredGlobal } from '../../__test-helpers__/GlobalSettingsHelpers';
import {
  sizeArb,
  isSmallerSize,
  relativeSizeArb,
  sizeForArbitraryArb,
  sizeRelatedGlobalConfigArb,
} from '../../__test-helpers__/SizeHelpers';

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
        sizeRelatedGlobalConfigArb,
        sizeArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (config, size, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength)
          );
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
        sizeRelatedGlobalConfigArb,
        relativeSizeArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (config, size, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const { baseSize: defaultSize = DefaultSize } = config;
          const equivalentSize = relativeSizeToSize(size, defaultSize);
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength)
          );
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
        sizeRelatedGlobalConfigArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (config, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const size = 'max';
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength)
          );

          // Assert
          expect(computedLength).toBe(maxLength);
        }
      )
    );
  });

  it('should ignore specifiedMaxLength whenever size specified', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        sizeForArbitraryArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (config, size, lengthA, lengthB) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, false)
          );
          const expectedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, true)
          );

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should fallback to "max" whenever no size specified but maxLength specified when defaultSizeToMaxWhenMaxSpecified true or unset', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (config, lengthA, lengthB) => {
          // Arrange
          fc.pre(
            config.defaultSizeToMaxWhenMaxSpecified === true || config.defaultSizeToMaxWhenMaxSpecified === undefined
          );
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(undefined, minLength, maxLength, true)
          );
          const expectedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary('max', minLength, maxLength, true)
          );

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should fallback to baseSize (or default) whenever no size specified and no maxLength specified', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        (config, lengthA, lengthB) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];
          const { baseSize: defaultSize = DefaultSize } = config;

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(undefined, minLength, maxLength, false)
          );
          const expectedLength = maxGeneratedLengthFromSizeForArbitrary(defaultSize, minLength, maxLength, false);

          // Assert
          expect(computedLength).toBe(expectedLength);
        }
      )
    );
  });

  it('should always return a length being between minLength and maxLength', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.option(sizeForArbitraryArb, { nil: undefined }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.integer({ min: 0, max: MaxLengthUpperBound }),
        fc.boolean(),
        (config, size, lengthA, lengthB, specifiedMaxLength) => {
          // Arrange
          const [minLength, maxLength] = lengthA < lengthB ? [lengthA, lengthB] : [lengthB, lengthA];

          // Act
          const computedLength = withConfiguredGlobal(config, () =>
            maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength)
          );

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
