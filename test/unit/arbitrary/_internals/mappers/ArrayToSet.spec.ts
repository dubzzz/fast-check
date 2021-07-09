import { arrayToSetUnmapper } from '../../../../../src/arbitrary/_internals/mappers/ArrayToSet';

describe('arrayToSetUnmapper', () => {
  it('should be able to unmap a Set with primitives', () => {
    // Arrange
    const expectedArray: unknown[] = ['a', 'b'];
    const source = new Set(expectedArray);

    // Act
    const out = arrayToSetUnmapper(source);

    // Assert
    expect(out).toEqual(expectedArray);
  });

  it('should be able to unmap a Set with object as keys and values', () => {
    // Arrange
    const v1 = {};
    const v2 = {};
    const source = new Set([v1, v2]);

    // Act
    const out = arrayToSetUnmapper(source);

    // Assert
    expect(out[0]).toBe(v1);
    expect(out[1]).toBe(v2);
  });

  it('should reject unmap of raw object', () => {
    // Arrange
    const source = {};

    // Act / Assert
    expect(() => arrayToSetUnmapper(source)).toThrowError();
  });
});
