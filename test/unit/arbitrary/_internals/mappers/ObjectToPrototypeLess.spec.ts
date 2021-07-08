import {
  objectToPrototypeLessMapper,
  objectToPrototypeLessUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/ObjectToPrototypeLess';

describe('objectToPrototypeLessMapper', () => {
  it('should be able to map empty instance with Object prototype to empty without any prototype', () => {
    // Arrange
    const source = {};
    expect(source).toBeInstanceOf(Object);

    // Act
    const out = objectToPrototypeLessMapper(source);

    // Assert
    expect(out).toEqual(Object.create(null));
    expect(out).not.toBeInstanceOf(Object);
  });

  it('should be able to map non-empty instance with Object prototype to non-empty without any prototype', () => {
    // Arrange
    const source = { a: 1, b: 2 };
    expect(source).toBeInstanceOf(Object);

    // Act
    const out = objectToPrototypeLessMapper(source);

    // Assert
    expect(out).toEqual(Object.assign(Object.create(null), { a: 1, b: 2 }));
    expect(out).not.toBeInstanceOf(Object);
  });
});

describe('objectToPrototypeLessUnmapper', () => {
  it('should be able to unmap empty instance without any prototype', () => {
    // Arrange
    const source = Object.create(null);
    expect(source).not.toBeInstanceOf(Object);

    // Act
    const out = objectToPrototypeLessUnmapper(source);

    // Assert
    expect(out).toEqual({});
    expect(out).toBeInstanceOf(Object);
  });

  it('should be able to unmap non-empty instance without any prototype', () => {
    // Arrange
    const source = Object.assign(Object.create(null), { a: 1, b: 2 });
    expect(source).not.toBeInstanceOf(Object);

    // Act
    const out = objectToPrototypeLessUnmapper(source);

    // Assert
    expect(out).toEqual({ a: 1, b: 2 });
    expect(out).toBeInstanceOf(Object);
  });

  it('should reject unmap of raw object', () => {
    // Arrange
    const source = {};
    expect(source).toBeInstanceOf(Object);

    // Act / Assert
    expect(() => objectToPrototypeLessUnmapper(source)).toThrowError();
  });
});
