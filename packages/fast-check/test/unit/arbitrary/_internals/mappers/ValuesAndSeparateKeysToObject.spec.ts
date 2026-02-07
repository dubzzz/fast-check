import { describe, it, expect } from 'vitest';
import {
  buildValuesAndSeparateKeysToObjectMapper,
  buildValuesAndSeparateKeysToObjectUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/ValuesAndSeparateKeysToObject.js';

describe('buildValuesAndSeparateKeysToObjectMapper', () => {
  it('should create instances with Object prototype when passed withNullPrototype=false', () => {
    // Arrange
    const keys: (string | symbol)[] = [];
    const magicNoValue = Symbol('no-value');
    const values: any[] = [];
    const withNullPrototype = false;
    const definition: Parameters<typeof mapper>[0] = [values, withNullPrototype];

    // Act
    const mapper = buildValuesAndSeparateKeysToObjectMapper<any, typeof magicNoValue>(keys, magicNoValue);
    const obj = mapper(definition);

    // Assert
    expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
  });

  it('should create instances with null prototype when passed withNullPrototype=true', () => {
    // Arrange
    const keys: (string | symbol)[] = [];
    const magicNoValue = Symbol('no-value');
    const values: any[] = [];
    const withNullPrototype = true;
    const definition: Parameters<typeof mapper>[0] = [values, withNullPrototype];

    // Act
    const mapper = buildValuesAndSeparateKeysToObjectMapper<any, typeof magicNoValue>(keys, magicNoValue);
    const obj = mapper(definition);

    // Assert
    expect(Object.getPrototypeOf(obj)).toBe(null);
  });

  it.each([{ withNullPrototype: true }, { withNullPrototype: false }])(
    'should replace magic values by no key when withNullPrototype=$withNullPrototype',
    ({ withNullPrototype }) => {
      // Arrange
      const keys: (string | symbol)[] = ['a', 'b', 'c', 'd'];
      const magicNoValue = Symbol('no-value');
      const values: any[] = [undefined, magicNoValue, null, 0];
      const definition: Parameters<typeof mapper>[0] = [values, withNullPrototype];

      // Act
      const mapper = buildValuesAndSeparateKeysToObjectMapper<any, typeof magicNoValue>(keys, magicNoValue);
      const obj = mapper(definition);

      // Assert
      expect(obj).toHaveProperty('a');
      expect(obj).not.toHaveProperty('b');
      expect(obj).toHaveProperty('c');
      expect(obj).toHaveProperty('d');
      expect(obj).toEqual({ a: undefined, c: null, d: 0 });
    },
  );

  it.each([{ withNullPrototype: true }, { withNullPrototype: false }])(
    'should be able to produce instances with "__proto__" as key when withNullPrototype=$withNullPrototype',
    ({ withNullPrototype }) => {
      // Arrange
      const keys: (string | symbol)[] = ['__proto__'];
      const magicNoValue = Symbol('no-value');
      const values: any[] = [0];
      const definition: Parameters<typeof mapper>[0] = [values, withNullPrototype];

      // Act
      const mapper = buildValuesAndSeparateKeysToObjectMapper<any, typeof magicNoValue>(keys, magicNoValue);
      const obj = mapper(definition);

      // Assert
      expect(Object.getPrototypeOf(obj)).toBe(withNullPrototype ? null : Object.prototype);
      expect(obj).toHaveProperty('__proto__');
      expect(obj.__proto__).toBe(0);
      expect(obj).toEqual({ ['__proto__']: 0 });
    },
  );
});

describe('buildValuesAndSeparateKeysToObjectUnmapper', () => {
  it('should properly unmap basic instances of Object without keys', () => {
    // Arrange
    const obj = {};
    const keys: (string | symbol)[] = [];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([[], false]);
  });

  it('should properly unmap basic instances of Object without keys nor prototype', () => {
    // Arrange
    const obj = Object.create(null);
    const keys: (string | symbol)[] = [];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([[], true]);
  });

  it('should properly unmap basic instances of Object with multiple keys and no missing', () => {
    // Arrange
    const obj = { a: 'e', 1: 'hello', b: undefined };
    const keys: (string | symbol)[] = ['b', '1', 'a'];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([[undefined, 'hello', 'e'], false]);
  });

  it('should properly unmap instances of Object with known symbols as keys', () => {
    // Arrange
    const s1 = Symbol('s1');
    const s2 = Symbol('s2');
    const obj = { a: 'e', [s2]: 'hello', [s1]: undefined };
    const keys: (string | symbol)[] = [s2, s1, 'a'];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([['hello', undefined, 'e'], false]);
  });

  it('should properly unmap instances of Object with missing keys', () => {
    // Arrange
    const s1 = Symbol('s1');
    const s2 = Symbol('s2');
    const s3 = Symbol('s2');
    const obj = { a: 'e', [s2]: 'hello', [s1]: undefined };
    const keys: (string | symbol)[] = [s2, 'b', s1, 'a', 'd', s3];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([['hello', magicNoValue, undefined, 'e', magicNoValue, magicNoValue], false]);
  });

  it('should properly unmap instances of Object with "__proto__" as key when set to a value', () => {
    // Arrange
    const obj = { ['__proto__']: 'e' };
    const keys: (string | symbol)[] = ['toString', '__proto__', 'a'];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([[magicNoValue, 'e', magicNoValue], false]);
  });

  it('should properly unmap instances of Object with "__proto__" as key when set to null', () => {
    // Arrange
    const obj = { ['__proto__']: null };
    const keys: (string | symbol)[] = ['toString', '__proto__', 'a'];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([[magicNoValue, null, magicNoValue], false]);
  });

  it('should properly unmap instances of Object with "__proto__" as key when unset', () => {
    // Arrange
    const obj = {};
    const keys: (string | symbol)[] = ['toString', '__proto__', 'a'];
    const magicNoValue = Symbol('no-value');

    // Act
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);
    const values = unmapper(obj);

    // Assert
    expect(values).toEqual([[magicNoValue, magicNoValue, magicNoValue], false]);
  });

  it.each`
    value                                                                | condition
    ${new (class A {})()}                                                | ${'it is not just a simple object but a more complex type'}
    ${[]}                                                                | ${'it is an Array'}
    ${new Number(0)}                                                     | ${'it is a boxed-Number'}
    ${0}                                                                 | ${'it is a number'}
    ${null}                                                              | ${'it is null'}
    ${undefined}                                                         | ${'it is undefined'}
    ${{ [Symbol('unknown')]: 5 }}                                        | ${'it contains an unknown symbol property'}
    ${{ [Symbol('unknown')]: 5, a: 6, [Symbol.for('a')]: 7 }}            | ${'it contains an unknown symbol property (even if others are there)'}
    ${{ unknown: 5 }}                                                    | ${'it contains an unknown named property'}
    ${{ unknown: 5, a: 6, [Symbol.for('a')]: 7 }}                        | ${'it contains an unknown named property (even if others are there)'}
    ${Object.defineProperty({}, 'a', { value: 5, configurable: false })} | ${'it contains a non-configurable property'}
    ${Object.defineProperty({}, 'a', { value: 5, enumerable: false })}   | ${'it contains a non-enumerable property'}
    ${Object.defineProperty({}, 'a', { value: 5, writable: false })}     | ${'it contains a non-writable property'}
    ${Object.defineProperty({}, 'a', { get: () => 5 })}                  | ${'it contains a get property'}
    ${Object.defineProperty({}, 'a', { set: () => {} })}                 | ${'it contains a set property'}
  `('should reject unmap on instance when $condition', ({ value }) => {
    // Arrange
    const keys: (string | symbol)[] = ['a', Symbol.for('a')];
    const magicNoValue = Symbol('no-value');
    const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<any, typeof magicNoValue>(keys, magicNoValue);

    // Act / Assert
    expect(() => unmapper(value)).toThrowError();
  });
});
