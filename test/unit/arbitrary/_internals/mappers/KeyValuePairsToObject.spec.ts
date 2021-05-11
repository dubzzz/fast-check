import {
  keyValuePairsToObjectMapper,
  keyValuePairsToObjectUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/KeyValuePairsToObject';

describe('keyValuePairsToObjectMapper', () => {
  it('should create instances with Object prototype', () => {
    // Arrange
    const keyValues: [string, unknown][] = [];

    // Act
    const obj = keyValuePairsToObjectMapper(keyValues);

    // Assert
    expect(obj.constructor).toBe(Object);
    expect(obj.__proto__).toBe(Object.prototype);
  });
});

describe('keyValuePairsToObjectUnmapper', () => {
  it('should properly unmap basic instances of Object without keys', () => {
    // Arrange
    const obj = {};

    // Act
    const keyValues = keyValuePairsToObjectUnmapper(obj);

    // Assert
    expect(keyValues).toEqual([]);
  });

  it('should properly unmap basic instances of Object with multiple keys', () => {
    // Arrange
    const obj = { a: 'e', 1: 'hello', b: undefined };

    // Act
    const keyValues = keyValuePairsToObjectUnmapper(obj);

    // Assert
    expect(keyValues).toHaveLength(3);
    expect(keyValues).toContainEqual(['a', 'e']);
    expect(keyValues).toContainEqual(['1', 'hello']);
    expect(keyValues).toContainEqual(['b', undefined]);
  });

  it.each`
    value                  | condition
    ${Object.create(null)} | ${'it has no prototype'}
    ${new (class A {})()}  | ${'it is not just a simple object but a more complex type'}
    ${[]}                  | ${'it is an Array'}
    ${new Number(0)}       | ${'it is a boxed-Number'}
    ${0}                   | ${'it is a number'}
    ${null}                | ${'it is null'}
    ${undefined}           | ${'it is undefined'}
  `('should reject unmap on instance when $condition', ({ value }) => {
    // Arrange / Act / Assert
    expect(() => keyValuePairsToObjectUnmapper(value)).toThrowError();
  });
});
