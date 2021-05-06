import fc from '../../../../../lib/fast-check';
import { extractStringConstraints } from '../../../../../src/arbitrary/_internals/helpers/StringConstraintsExtractor';

describe('extractStringConstraints', () => {
  it('should convert max-only signature to proper constraints', () =>
    fc.assert(
      fc.property(fc.nat(), (maxLength) => {
        // Arrange / Act
        const constraints = extractStringConstraints([maxLength]);

        // Assert
        expect(constraints).toEqual({ maxLength });
      })
    ));

  it('should convert min and max signature to proper constraints', () =>
    fc.assert(
      fc.property(fc.nat(), fc.nat(), (minLength, maxLength) => {
        // Arrange / Act
        const constraints = extractStringConstraints([minLength, maxLength]);

        // Assert
        expect(constraints).toEqual({ minLength, maxLength });
        // Remark: The function does not check validity of the input, it just converts it to constraints
      })
    ));

  it('should preserve valid constraints', () =>
    fc.assert(
      fc.property(
        fc.record({ minLength: fc.nat(), maxLength: fc.nat() }, { requiredKeys: [] }),
        (sourceConstraints) => {
          // Arrange / Act
          const constraints = extractStringConstraints([sourceConstraints]);

          // Assert
          expect(constraints).toBe(sourceConstraints);
          // Remark: The function does not check validity of the input, it just converts it to constraints
        }
      )
    ));
});
