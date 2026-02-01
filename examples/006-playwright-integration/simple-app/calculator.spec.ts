import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
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

    it.prop([fc.integer(), fc.integer()])('should be commutative', (a, b) => {
      // Arrange & Act
      const result1 = add(a, b);
      const result2 = add(b, a);

      // Assert
      expect(result1).toBe(result2);
    });

    it.prop([fc.integer(), fc.integer(), fc.integer()])(
      'should be associative',
      (a, b, c) => {
        // Arrange & Act
        const result1 = add(add(a, b), c);
        const result2 = add(a, add(b, c));

        // Assert
        expect(result1).toBe(result2);
      }
    );

    it.prop([fc.integer()])('should have zero as identity element', (a) => {
      // Arrange & Act
      const result = add(a, 0);

      // Assert
      expect(result).toBe(a);
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

    it.prop([fc.integer(), fc.integer()])('should be inverse of addition', (a, b) => {
      // Arrange & Act
      const sum = add(a, b);
      const difference = subtract(sum, b);

      // Assert
      expect(difference).toBe(a);
    });

    it.prop([fc.integer()])('should return zero when subtracting itself', (a) => {
      // Arrange & Act
      const result = subtract(a, a);

      // Assert
      expect(result).toBe(0);
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

    it.prop([fc.integer(), fc.integer()])('should be commutative', (a, b) => {
      // Arrange & Act
      const result1 = multiply(a, b);
      const result2 = multiply(b, a);

      // Assert
      expect(result1).toBe(result2);
    });

    it.prop([fc.integer(), fc.integer(), fc.integer()])(
      'should be associative',
      (a, b, c) => {
        // Arrange & Act
        const result1 = multiply(multiply(a, b), c);
        const result2 = multiply(a, multiply(b, c));

        // Assert
        expect(result1).toBe(result2);
      }
    );

    it.prop([fc.integer()])('should have one as identity element', (a) => {
      // Arrange & Act
      const result = multiply(a, 1);

      // Assert
      expect(result).toBe(a);
    });

    it.prop([fc.integer()])('should return zero when multiplied by zero', (a) => {
      // Arrange & Act
      const result = multiply(a, 0);

      // Assert
      expect(result).toBe(0);
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

    it.prop([fc.integer(), fc.integer({ min: 1 })])(
      'should be inverse of multiplication for non-zero divisors',
      (a, b) => {
        // Arrange & Act
        const product = multiply(a, b);
        const quotient = divide(product, b);

        // Assert
        expect(quotient).toBe(a);
      }
    );

    it.prop([fc.integer().filter((n) => n !== 0)])('should return one when divided by itself', (a) => {
      // Arrange & Act
      const result = divide(a, a);

      // Assert
      expect(result).toBe(1);
    });
  });
});
