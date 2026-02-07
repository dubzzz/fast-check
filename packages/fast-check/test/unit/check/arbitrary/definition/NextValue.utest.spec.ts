import { describe, it, expect, vi } from 'vitest';
import { Value } from '../../../../../src/check/arbitrary/definition/Value.js';
import { cloneMethod } from '../../../../../src/check/symbols.js';

describe('Value', () => {
  describe('cloneable values', () => {
    it('should not clone cloneable values on first access', () => {
      // Arrange
      const clone = vi.fn();
      const instance = { [cloneMethod]: clone };

      // Act
      const nextValue = new Value(instance, undefined);
      const value = nextValue.value;

      // Assert
      expect(value).toBe(instance);
      expect(clone).not.toHaveBeenCalled();
    });

    it('should clone cloneable values on second access', () => {
      // Arrange
      const clone = vi.fn();
      const instance = { [cloneMethod]: clone };

      // Act
      const nextValue = new Value(instance, undefined);
      const value = nextValue.value;
      const value2 = nextValue.value;

      // Assert
      expect(value2).not.toBe(value);
      expect(value2).not.toBe(instance);
      expect(clone).toHaveBeenCalledTimes(1);
    });

    it('should not call cloneMethod of cloneable values on second access if customGetValue was provided', () => {
      // Arrange
      const clone = vi.fn();
      const cloneOverride = vi.fn();
      const instance = { [cloneMethod]: clone };

      // Act
      const nextValue = new Value(instance, null, cloneOverride);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      nextValue.value;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      nextValue.value;

      // Assert
      expect(clone).not.toHaveBeenCalled();
      expect(cloneOverride).toHaveBeenCalledTimes(2);
    });
  });
});
