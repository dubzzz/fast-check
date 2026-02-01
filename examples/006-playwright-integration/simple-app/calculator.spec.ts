import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { add, subtract, multiply, divide } from './calculator';

describe('Calculator Unit Tests', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      // Arrange
      const a = 5;
      const b = 3;

      // Act
      const result = add(a, b);

      // Assert
      expect(result).toBe(8);
    });

    it('should handle negative numbers', () => {
      // Arrange
      const a = -5;
      const b = 3;

      // Act
      const result = add(a, b);

      // Assert
      expect(result).toBe(-2);
    });

    it('should be commutative', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          // Arrange & Act
          const result1 = add(a, b);
          const result2 = add(b, a);

          // Assert
          expect(result1).toBe(result2);
        })
      );
    });

    it('should be associative', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
          // Arrange & Act
          const result1 = add(add(a, b), c);
          const result2 = add(a, add(b, c));

          // Assert
          expect(result1).toBe(result2);
        })
      );
    });

    it('should have zero as identity element', () => {
      fc.assert(
        fc.property(fc.integer(), (a) => {
          // Arrange & Act
          const result = add(a, 0);

          // Assert
          expect(result).toBe(a);
        })
      );
    });
  });

  describe('subtract', () => {
    it('should subtract two positive numbers', () => {
      // Arrange
      const a = 5;
      const b = 3;

      // Act
      const result = subtract(a, b);

      // Assert
      expect(result).toBe(2);
    });

    it('should be inverse of addition', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          // Arrange & Act
          const sum = add(a, b);
          const difference = subtract(sum, b);

          // Assert
          expect(difference).toBe(a);
        })
      );
    });

    it('should return zero when subtracting itself', () => {
      fc.assert(
        fc.property(fc.integer(), (a) => {
          // Arrange & Act
          const result = subtract(a, a);

          // Assert
          expect(result).toBe(0);
        })
      );
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      // Arrange
      const a = 5;
      const b = 3;

      // Act
      const result = multiply(a, b);

      // Assert
      expect(result).toBe(15);
    });

    it('should be commutative', () => {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          // Arrange & Act
          const result1 = multiply(a, b);
          const result2 = multiply(b, a);

          // Assert
          expect(result1).toBe(result2);
        })
      );
    });

    it('should be associative', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          fc.integer({ min: -10000, max: 10000 }),
          fc.integer({ min: -10000, max: 10000 }),
          (a, b, c) => {
            // Arrange & Act
            const result1 = multiply(multiply(a, b), c);
            const result2 = multiply(a, multiply(b, c));

            // Assert
            // Note: For very large numbers, JavaScript's floating point precision may cause slight differences
            // This test demonstrates that property-based testing can find edge cases
            expect(result1).toBe(result2);
          }
        )
      );
    });

    it('should have one as identity element', () => {
      fc.assert(
        fc.property(fc.integer(), (a) => {
          // Arrange & Act
          const result = multiply(a, 1);

          // Assert
          expect(result).toBe(a);
        })
      );
    });

    it('should return zero when multiplied by zero', () => {
      fc.assert(
        fc.property(fc.integer(), (a) => {
          // Arrange & Act
          const result = multiply(a, 0);

          // Assert
          // JavaScript has -0 and +0, both are considered zero but Object.is distinguishes them
          expect(Math.abs(result)).toBe(0);
        })
      );
    });
  });

  describe('divide', () => {
    it('should divide two positive numbers', () => {
      // Arrange
      const a = 6;
      const b = 3;

      // Act
      const result = divide(a, b);

      // Assert
      expect(result).toBe(2);
    });

    it('should throw error when dividing by zero', () => {
      // Arrange
      const a = 5;
      const b = 0;

      // Act & Assert
      expect(() => divide(a, b)).toThrow('Cannot divide by zero');
    });

    it('should be inverse of multiplication for non-zero divisors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (a, b) => {
            // Arrange & Act
            const product = multiply(a, b);
            const quotient = divide(product, b);

            // Assert
            // Note: Using closeTo for floating point comparison due to precision limits
            expect(Math.abs(quotient - a)).toBeLessThan(0.001);
          }
        )
      );
    });

    it('should return one when divided by itself', () => {
      fc.assert(
        fc.property(fc.integer().filter((n) => n !== 0), (a) => {
          // Arrange & Act
          const result = divide(a, a);

          // Assert
          expect(result).toBe(1);
        })
      );
    });
  });
});
