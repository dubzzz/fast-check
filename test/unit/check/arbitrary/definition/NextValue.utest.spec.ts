import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { cloneMethod } from '../../../../../src/check/symbols';

describe('NextValue', () => {
  describe('cloneable values', () => {
    it('should not clone cloneable values on first access', () => {
      // Arrange
      const clone = jest.fn();
      const instance = { [cloneMethod]: clone };

      // Act
      const nextValue = new NextValue(instance, undefined);
      const value = nextValue.value;

      // Assert
      expect(value).toBe(instance);
      expect(clone).not.toHaveBeenCalled();
    });

    it('should clone cloneable values on second access', () => {
      // Arrange
      const clone = jest.fn();
      const instance = { [cloneMethod]: clone };

      // Act
      const nextValue = new NextValue(instance, undefined);
      const value = nextValue.value;
      const value2 = nextValue.value;

      // Assert
      expect(value2).not.toBe(value);
      expect(value2).not.toBe(instance);
      expect(clone).toHaveBeenCalledTimes(1);
    });

    it('should not call cloneMethod of cloneable values on second access if customGetValue was provided', () => {
      // Arrange
      const clone = jest.fn();
      const cloneOverride = jest.fn();
      const instance = { [cloneMethod]: clone };

      // Act
      const nextValue = new NextValue(instance, null, cloneOverride);
      nextValue.value;
      nextValue.value;

      // Assert
      expect(clone).not.toHaveBeenCalled();
      expect(cloneOverride).toHaveBeenCalledTimes(2);
    });
  });
});
