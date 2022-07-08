import {
  keyValuePairsToObjectMapper,
  keyValuePairsToObjectUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/KeyValuePairsToObject';
import fc from '../../../../../src/fast-check';

describe('keyValuePairsToObjectMapper', () => {
  it('should create instances with Object prototype', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.tuple(fc.string(), fc.anything()), { selector: (kv) => kv[0] }), (keyValues) => {
        // Arrange / Act
        const obj = keyValuePairsToObjectMapper(keyValues);

        // Assert
        expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
        if (!keyValues.some(([k]) => k === 'constructor')) {
          expect(obj.constructor).toBe(Object);
        }
        if (!keyValues.some(([k]) => k === '__proto__')) {
          expect(obj.__proto__).toBe(Object.prototype);
        }
      })
    );
  });

  it('should create instances with all requested keys', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.tuple(fc.string(), fc.anything()), { selector: (kv) => kv[0] }), (keyValues) => {
        // Arrange / Act
        const obj = keyValuePairsToObjectMapper(keyValues);

        // Assert
        expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
        for (const [key, value] of keyValues) {
          expect(key in obj).toBe(true);
          expect(obj[key]).toBe(value);
        }
      })
    );
  });

  it('should create the same instances as-if we used bracket-based assignment', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.tuple(
            fc.string().filter((k) => k !== '__proto__'),
            fc.anything()
          ),
          { selector: (kv) => kv[0] }
        ),
        (keyValues) => {
          // Arrange / Act
          const obj = keyValuePairsToObjectMapper(keyValues);
          const refObj = Object.fromEntries(keyValues); // will miss __proto__ if passed as keys

          // Assert
          expect(obj).toEqual(refObj);
          expect(Object.keys(obj).sort()).toEqual(Object.keys(refObj).sort());
          expect(Object.getOwnPropertyNames(obj).sort()).toEqual(Object.getOwnPropertyNames(refObj).sort());
          expect(Object.getOwnPropertyDescriptors(obj)).toEqual(Object.getOwnPropertyDescriptors(refObj));
        }
      )
    );
  });

  it('should be able to build instances with dangerous keys', () => {
    // Arrange / Act
    const obj = keyValuePairsToObjectMapper([
      ['__proto__', '1'],
      ['constructor', '2'],
      ['toString', '3'],
    ]);

    // Assert
    expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
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
    value                                                                | condition
    ${Object.create(null)}                                               | ${'it has no prototype'}
    ${new (class A {})()}                                                | ${'it is not just a simple object but a more complex type'}
    ${[]}                                                                | ${'it is an Array'}
    ${new Number(0)}                                                     | ${'it is a boxed-Number'}
    ${0}                                                                 | ${'it is a number'}
    ${null}                                                              | ${'it is null'}
    ${undefined}                                                         | ${'it is undefined'}
    ${{ [Symbol('my-symbol')]: 5 }}                                      | ${'it contains a symbol property'}
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
