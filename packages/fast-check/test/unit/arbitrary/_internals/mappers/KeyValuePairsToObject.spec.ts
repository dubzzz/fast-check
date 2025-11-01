import { describe, it, expect } from 'vitest';
import {
  keyValuePairsToObjectMapper,
  keyValuePairsToObjectUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/KeyValuePairsToObject';
import fc from '../../../../../src/fast-check';

describe('keyValuePairsToObjectMapper', () => {
  it('should create instances with Object prototype when requested to', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.tuple(fc.oneof(fc.string(), fc.nat(), fc.string().map(Symbol)), fc.anything()), {
          selector: (kv) =>
            // Numbers will become strings when used in an object.
            typeof kv[0] === 'number' ? String(kv[0]) : kv[0],
        }),
        (keyValues) => {
          // Arrange / Act
          const obj = keyValuePairsToObjectMapper([keyValues, false]);

          // Assert
          expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
          if (!keyValues.some(([k]) => k === 'constructor')) {
            expect(obj.constructor).toBe(Object);
          }
          if (!keyValues.some(([k]) => k === '__proto__')) {
            expect(obj.__proto__).toBe(Object.prototype);
          }
        },
      ),
    );
  });

  it('should create instances with null prototype when requested to', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.tuple(fc.oneof(fc.string(), fc.nat(), fc.string().map(Symbol)), fc.anything()), {
          selector: (kv) =>
            // Numbers will become strings when used in an object.
            typeof kv[0] === 'number' ? String(kv[0]) : kv[0],
        }),
        (keyValues) => {
          // Arrange / Act
          const obj = keyValuePairsToObjectMapper([keyValues, true]);

          // Assert
          expect(Object.getPrototypeOf(obj)).toBe(null);
          if (!keyValues.some(([k]) => k === 'constructor')) {
            expect('constructor' in obj).toBe(false);
          }
          if (!keyValues.some(([k]) => k === '__proto__')) {
            expect('__proto__' in obj).toBe(false);
          }
        },
      ),
    );
  });

  it('should create instances with all requested keys', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.tuple(fc.oneof(fc.string(), fc.nat(), fc.string().map(Symbol)), fc.anything()), {
          selector: (kv) =>
            // Numbers will become strings when used in an object.
            typeof kv[0] === 'number' ? String(kv[0]) : kv[0],
        }),
        fc.boolean(),
        (keyValues, withNullPrototype) => {
          // Arrange / Act
          const obj = keyValuePairsToObjectMapper([keyValues, withNullPrototype]);

          // Assert
          expect(Object.getPrototypeOf(obj)).toBe(withNullPrototype ? null : Object.prototype);
          for (const [key, value] of keyValues) {
            expect(key in obj).toBe(true);
            expect(obj[key]).toBe(value);
          }
        },
      ),
    );
  });

  it('should create the same instances as-if we used bracket-based assignment (except proto for null case)', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.tuple(
            fc.oneof(
              fc.string().filter((k) => k !== '__proto__'),
              fc.nat(),
              fc.string().map(Symbol),
            ),
            fc.anything(),
          ),
          {
            selector: (kv) =>
              // Numbers will become strings when used in an object.
              typeof kv[0] === 'number' ? String(kv[0]) : kv[0],
          },
        ),
        fc.boolean(),
        (keyValues, withNullPrototype) => {
          // Arrange / Act
          const obj = keyValuePairsToObjectMapper([keyValues, withNullPrototype]);
          const refObj = Object.fromEntries(keyValues); // will miss __proto__ if passed as keys

          // Assert
          expect(Reflect.ownKeys(obj)).toEqual(Reflect.ownKeys(refObj));
          expect(Object.keys(obj).sort()).toEqual(Object.keys(refObj).sort());
          expect(Object.entries(obj)).toEqual(Object.entries(refObj));
          expect(Object.getOwnPropertyNames(obj).sort()).toEqual(Object.getOwnPropertyNames(refObj).sort());
          expect(Object.getOwnPropertyDescriptors(obj)).toEqual(Object.getOwnPropertyDescriptors(refObj));
        },
      ),
    );
  });

  it.each`
    name        | withNullPrototype
    ${'Object'} | ${false}
    ${'null'}   | ${true}
  `('should be able to build instances with dangerous keys in $name-proto case', ({ withNullPrototype }) => {
    // Arrange / Act
    const obj = keyValuePairsToObjectMapper([
      [
        ['__proto__', '1'],
        ['constructor', '2'],
        ['toString', '3'],
      ],
      withNullPrototype,
    ]);

    // Assert
    expect(Object.getPrototypeOf(obj)).toBe(withNullPrototype ? null : Object.prototype);
    // Valid values
    expect(obj.__proto__).toBe('1');
    expect(obj.constructor).toBe('2');
    expect(obj.toString).toBe('3');
    // Enumerable properties
    expect(Object.keys(obj).sort()).toEqual(['__proto__', 'constructor', 'toString'].sort());
    expect(Object.values(obj).sort()).toEqual(['1', '2', '3'].sort());
  });
});

describe('keyValuePairsToObjectUnmapper', () => {
  it('should properly unmap basic instances of Object without keys', () => {
    // Arrange
    const obj = {};

    // Act
    const [keyValues, withNullPrototype] = keyValuePairsToObjectUnmapper(obj);

    // Assert
    expect(keyValues).toEqual([]);
    expect(withNullPrototype).toBe(false);
  });

  it('should properly unmap basic instances of null-proto Object without keys', () => {
    // Arrange
    const obj = Object.create(null);

    // Act
    const [keyValues, withNullPrototype] = keyValuePairsToObjectUnmapper(obj);

    // Assert
    expect(keyValues).toEqual([]);
    expect(withNullPrototype).toBe(true);
  });

  it('should properly unmap basic instances of Object with multiple keys', () => {
    // Arrange
    const symbol = Symbol('hi');
    const obj = { a: 'e', 1: 'hello', b: undefined, [symbol]: '!' };

    // Act
    const [keyValues, withNullPrototype] = keyValuePairsToObjectUnmapper(obj);

    // Assert
    expect(keyValues).toHaveLength(4);
    expect(keyValues).toContainEqual(['a', 'e']);
    expect(keyValues).toContainEqual(['1', 'hello']);
    expect(keyValues).toContainEqual(['b', undefined]);
    expect(keyValues).toContainEqual([symbol, '!']);
    expect(withNullPrototype).toBe(false);
  });

  it('should properly unmap a fake null-prototype instance', () => {
    // Arrange
    const obj = { ['__proto__']: null };

    // Act
    const [keyValues, withNullPrototype] = keyValuePairsToObjectUnmapper(obj);

    // Assert
    expect(keyValues).toHaveLength(1);
    expect(keyValues).toContainEqual(['__proto__', null]);
    expect(withNullPrototype).toBe(false);
  });

  it.each`
    value                                                                | condition
    ${new (class A {})()}                                                | ${'it is not just a simple object but a more complex type'}
    ${[]}                                                                | ${'it is an Array'}
    ${new Number(0)}                                                     | ${'it is a boxed-Number'}
    ${0}                                                                 | ${'it is a number'}
    ${null}                                                              | ${'it is null'}
    ${undefined}                                                         | ${'it is undefined'}
    ${Object.defineProperty({}, 'a', { value: 5, configurable: false })} | ${'it contains a non-configurable property'}
    ${Object.defineProperty({}, 'a', { value: 5, enumerable: false })}   | ${'it contains a non-enumerable property'}
    ${Object.defineProperty({}, 'a', { value: 5, writable: false })}     | ${'it contains a non-writable property'}
    ${Object.defineProperty({}, 'a', { get: () => 5 })}                  | ${'it contains a get property'}
    ${Object.defineProperty({}, 'a', { set: () => {} })}                 | ${'it contains a set property'}
  `('should reject unmap on instance when $condition', ({ value }) => {
    // Arrange / Act / Assert
    expect(() => keyValuePairsToObjectUnmapper(value)).toThrowError();
  });
});
