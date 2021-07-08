import { arrayToMapUnmapper } from '../../../../../src/arbitrary/_internals/mappers/ArrayToMap';

describe('arrayToMapUnmapper', () => {
  it('should be able to unmap a Map with primitives', () => {
    // Arrange
    const expectedArray: [unknown, unknown][] = [
      ['a', 'A'],
      ['b', 'B'],
    ];
    const source = new Map(expectedArray);

    // Act
    const out = arrayToMapUnmapper(source);

    // Assert
    expect(out).toEqual(expectedArray);
  });

  it('should be able to unmap a Map with object as keys and values', () => {
    // Arrange
    const k1 = {};
    const v1 = {};
    const k2 = {};
    const v2 = {};
    const source = new Map([
      [k1, v1],
      [k2, v2],
    ]);

    // Act
    const out = arrayToMapUnmapper(source);

    // Assert
    expect(out[0][0]).toBe(k1);
    expect(out[0][1]).toBe(v1);
    expect(out[1][0]).toBe(k2);
    expect(out[1][1]).toBe(v2);
  });

  it('should reject unmap of raw object', () => {
    // Arrange
    const source = {};

    // Act / Assert
    expect(() => arrayToMapUnmapper(source)).toThrowError();
  });
});
