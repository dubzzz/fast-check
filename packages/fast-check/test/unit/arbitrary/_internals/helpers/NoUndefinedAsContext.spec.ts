import {
  noUndefinedAsContext,
  UndefinedContextPlaceholder,
} from '../../../../../src/arbitrary/_internals/helpers/NoUndefinedAsContext';
import { Value } from '../../../../../src/check/arbitrary/definition/Value';

describe('noUndefinedAsContext', () => {
  it('should never alter value if context is not undefined', () => {
    // Arrange
    const value = new Value(1, 'my-context');

    // Act
    const out = noUndefinedAsContext(value);

    // Assert
    expect(out).toBe(value);
  });

  it('should never alter value if context is not undefined even if cloneable', () => {
    // Arrange
    const value = new Value(1, 'my-context', () => 2);

    // Act
    const out = noUndefinedAsContext(value);

    // Assert
    expect(out).toBe(value);
    expect(value.hasToBeCloned).toBe(true); // sanity check
  });

  it('should create a new value with same underlying but defined context whenever context is undefined', () => {
    // Arrange
    const value = new Value(1, undefined);

    // Act
    const out = noUndefinedAsContext(value);

    // Assert
    expect(out).not.toBe(value);
    expect(out.value).toBe(value.value);
    expect(out.context).toBe(UndefinedContextPlaceholder);
    expect(out.hasToBeCloned).toBe(value.hasToBeCloned);
  });

  it('should create a new value with same underlying but defined context whenever context is undefined even if cloneable', () => {
    // Arrange
    const value = new Value(1, undefined, () => 2);

    // Act
    const out = noUndefinedAsContext(value);

    // Assert
    expect(out).not.toBe(value);
    expect(out.value).toBe(value.value);
    expect(out.context).toBe(UndefinedContextPlaceholder);
    expect(out.hasToBeCloned).toBe(value.hasToBeCloned);
  });
});
