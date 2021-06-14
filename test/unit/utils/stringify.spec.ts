import * as fc from '../../../lib/fast-check';

// Importing 'buffer' imports the real implementation from node
// Instead we want 'buffer' from our node_modules - the most used polyfill for Buffer on browser-side
import { Buffer as NotNodeBuffer } from '../../../node_modules/buffer';

import { asyncStringify, possiblyAsyncStringify, stringify } from '../../../src/utils/stringify';

declare function BigInt(n: number | bigint | string): bigint;

const checkEqual = (a: any, b: any): boolean => {
  try {
    expect(a).toEqual(b);
    return true;
  } catch (err) {
    return false;
  }
};

class ThrowingToString {
  toString() {
    throw new Error('No toString');
  }
}

class CustomTagThrowingToString {
  [Symbol.toStringTag] = 'CustomTagThrowingToString';
  toString() {
    throw new Error('No toString');
  }
}

const anythingEnableAll = {
  withBoxedValues: true,
  withMap: true,
  withSet: true,
  withObjectString: true,
  withNullPrototype: true,
  withDate: true,
  withTypedArray: true,
  withSparseArray: true,
  ...(typeof BigInt !== 'undefined' ? { withBigInt: true } : {}),
};

describe('stringify', () => {
  it('Should be able to stringify fc.anything()', () =>
    fc.assert(fc.property(fc.anything(anythingEnableAll), (a) => typeof stringify(a) === 'string')));
  it('Should be able to stringify fc.char16bits() (ie. possibly invalid strings)', () =>
    fc.assert(fc.property(fc.char16bits(), (a) => typeof stringify(a) === 'string')));
  if (typeof BigInt !== 'undefined') {
    it('Should be able to stringify bigint in object correctly', () =>
      fc.assert(fc.property(fc.bigInt(), (b) => stringify({ b }) === '{"b":' + b + 'n}')));
  }
  it('Should be equivalent to JSON.stringify for JSON compliant objects', () =>
    fc.assert(
      fc.property(
        fc.anything({ values: [fc.boolean(), fc.integer(), fc.double(), fc.fullUnicodeString(), fc.constant(null)] }),
        (obj) => {
          expect(stringify(obj)).toEqual(JSON.stringify(obj));
        }
      )
    ));
  it('Should be readable from eval', () =>
    fc.assert(
      fc.property(fc.anything(anythingEnableAll), (obj) => {
        expect(eval(`(function() { return ${stringify(obj)}; })()`)).toStrictEqual(obj as any);
      })
    ));
  it('Should stringify differently distinct objects', () =>
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (a, b) => {
        fc.pre(!checkEqual(a, b));
        expect(stringify(a)).not.toEqual(stringify(b));
      })
    ));
  it('Should be able to stringify cyclic object', () => {
    const cyclic: any = { a: 1, b: 2, c: 3 };
    cyclic.b = cyclic;
    const repr = stringify(cyclic);
    expect(repr).toContain('"a"');
    expect(repr).toContain('"b"');
    expect(repr).toContain('"c"');
    expect(repr).toContain('[cyclic]');
    expect(repr).toEqual('{"a":1,"b":[cyclic],"c":3}');
  });
  it('Should be able to stringify cyclic arrays', () => {
    const cyclic: any[] = [1, 2, 3];
    cyclic.push(cyclic);
    cyclic.push(4);
    const repr = stringify(cyclic);
    expect(repr).toEqual('[1,2,3,[cyclic],4]');
  });
  it('Should be able to stringify small sparse arrays', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([,])).toEqual('[,]'); // empty with one hole
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([, ,])).toEqual('[,,]'); // empty with two holes
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([, , , ,])).toEqual('[,,,,]'); // empty with four holes
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([1, , ,])).toEqual('[1,,,]'); // one value then two holes
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([, , 1, , 2])).toEqual('[,,1,,2]'); // two holes non-trailing holes
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([1, , 2])).toEqual('[1,,2]'); // one hole non-trailing hole
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([1, 2, ,])).toEqual('[1,2,,]'); // two values then one hole
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify([1, 2, , ,])).toEqual('[1,2,,,]'); // two values then two holes
  });
  it('Should be able to stringify large sparse arrays', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify(Array(10000))).toEqual('Array(10000)');
    // eslint-disable-next-line no-sparse-arrays
    expect(stringify(Array(4294967295))).toEqual('Array(4294967295)');
    // eslint-disable-next-line no-sparse-arrays
    const sparseNonEmpty: any[] = Array(10000);
    sparseNonEmpty[150] = 5;
    sparseNonEmpty[21] = 1;
    sparseNonEmpty[200] = 10;
    expect(stringify(sparseNonEmpty)).toEqual('Object.assign(Array(10000),{21:1,150:5,200:10})');
    // Here are some possibilities for sparse versions:
    // > (s=Array(10000),s[21]=1,s[150]=5,s[200]=10,s)
    // > (()=>{const s=Array(10000);s[21]=1;s[150]=5;s[200]=10;return s;})()
    // > Object.assign(Array(10000), {21:1,150:5,200:10})
    // > [<20 empty slots>, 1,...] [cannot be copy-pasted]
    const sparseNonEmptyB: any[] = Array(4294967295);
    sparseNonEmptyB[1234567890] = 5;
    expect(stringify(sparseNonEmptyB)).toEqual('Object.assign(Array(4294967295),{1234567890:5})');
    const sparseNonEmptyC: any[] = Array(123456);
    sparseNonEmptyC[0] = 0;
    sparseNonEmptyC[1] = 1;
    expect(stringify(sparseNonEmptyC)).toEqual('Object.assign(Array(123456),{0:0,1:1})');
  });
  it('Should be able to stringify cyclic sets', () => {
    const cyclic: Set<any> = new Set([1, 2, 3]);
    cyclic.add(cyclic);
    cyclic.add(4);
    const repr = stringify(cyclic);
    expect(repr).toEqual('new Set([1,2,3,[cyclic],4])');
  });
  it('Should be able to stringify cyclic maps', () => {
    const cyclic: Map<any, any> = new Map();
    cyclic.set(1, 2);
    cyclic.set(3, cyclic);
    cyclic.set(cyclic, 4);
    cyclic.set(5, 6);
    const repr = stringify(cyclic);
    expect(repr).toEqual('new Map([[1,2],[3,[cyclic]],[[cyclic],4],[5,6]])');
  });
  it('Should be able to stringify values', () => {
    expect(stringify(null)).toEqual('null');
    expect(stringify(undefined)).toEqual('undefined');
    expect(stringify(false)).toEqual('false');
    expect(stringify(42)).toEqual('42');
    expect(stringify(-0)).toEqual('-0');
    expect(stringify(Number.POSITIVE_INFINITY)).toEqual('Number.POSITIVE_INFINITY');
    expect(stringify(Number.NEGATIVE_INFINITY)).toEqual('Number.NEGATIVE_INFINITY');
    expect(stringify(Number.NaN)).toEqual('Number.NaN');
    expect(stringify('Hello')).toEqual('"Hello"');
    if (typeof BigInt !== 'undefined') {
      expect(stringify(BigInt(42))).toEqual('42n');
    }
  });
  it('Should be able to stringify boxed values', () => {
    expect(stringify(new Boolean(false))).toEqual('new Boolean(false)');
    expect(stringify(new Number(42))).toEqual('new Number(42)');
    expect(stringify(new Number(-0))).toEqual('new Number(-0)');
    expect(stringify(new Number(Number.POSITIVE_INFINITY))).toEqual('new Number(Number.POSITIVE_INFINITY)');
    expect(stringify(new Number(Number.NEGATIVE_INFINITY))).toEqual('new Number(Number.NEGATIVE_INFINITY)');
    expect(stringify(new Number(Number.NaN))).toEqual('new Number(Number.NaN)');
    expect(stringify(new String('Hello'))).toEqual('new String("Hello")');
  });
  it('Should be able to stringify Date', () => {
    expect(stringify(new Date(NaN))).toEqual('new Date(NaN)');
    expect(stringify(new Date('2014-25-23'))).toEqual('new Date(NaN)');
    expect(stringify(new Date('2019-05-23T22:19:06.049Z'))).toEqual('new Date("2019-05-23T22:19:06.049Z")');
  });
  it('Should be able to stringify Regex', () => {
    expect(stringify(/\w+/)).toEqual('/\\w+/');
    expect(stringify(/^Hello(\d+)(\w*)$/gi)).toEqual('/^Hello(\\d+)(\\w*)$/gi');
    expect(stringify(new RegExp('\\w+'))).toEqual('/\\w+/');
  });
  it('Should be able to stringify Set', () => {
    expect(stringify(new Set([1, 2]))).toEqual('new Set([1,2])');
  });
  it('Should be able to stringify Map', () => {
    expect(stringify(new Map([[1, 2]]))).toEqual('new Map([[1,2]])');
  });
  it('Should be able to stringify Symbol', () => {
    expect(stringify(Symbol())).toEqual('Symbol()');
    expect(stringify(Symbol('fc'))).toEqual('Symbol("fc")');
    expect(stringify(Symbol.for('fc'))).toEqual('Symbol.for("fc")');
  });
  it('Should be able to stringify well-known Symbols', () => {
    expect(stringify(Symbol.iterator)).toEqual('Symbol.iterator');
    expect(stringify(Symbol('Symbol.iterator'))).toEqual('Symbol("Symbol.iterator")');

    // Same as above but with all the known symbols
    let foundOne = false;
    for (const symbolName of Object.getOwnPropertyNames(Symbol)) {
      const s = (Symbol as any)[symbolName];
      if (typeof s === 'symbol') {
        foundOne = true;
        expect(stringify(s)).toEqual(`Symbol.${symbolName}`);
        expect(stringify(Symbol(`Symbol.${symbolName}`))).toEqual(`Symbol("Symbol.${symbolName}")`);
        expect(eval(`(function() { return typeof ${stringify(s)}; })()`)).toBe('symbol');
      }
    }
    expect(foundOne).toBe(true);
  });
  it('Should be able to stringify Object', () => {
    expect(stringify({ a: 1 })).toEqual('{"a":1}');
    expect(stringify({ a: 1, b: 2 })).toEqual('{"a":1,"b":2}');
    expect(stringify({ [Symbol.for('a')]: 1 })).toEqual('{[Symbol.for("a")]:1}');
    expect(stringify({ a: 1, [Symbol.for('a')]: 1 })).toEqual('{"a":1,[Symbol.for("a")]:1}');
    expect(stringify({ [Symbol.for('a')]: 1, a: 1 })).toEqual('{"a":1,[Symbol.for("a")]:1}');
  });
  it('Should be able to stringify Object but skip non enumerable properties', () => {
    // At least for the moment we don't handle non enumerable properties
    const obj: any = {};
    Object.defineProperties(obj, {
      a: { value: 1, enumerable: false },
      b: { value: 1, enumerable: true },
      [Symbol.for('a')]: { value: 1, enumerable: false },
      [Symbol.for('b')]: { value: 1, enumerable: true },
    });
    expect(stringify(obj)).toEqual('{"b":1,[Symbol.for("b")]:1}');
  });
  it('Should be able to stringify instances of classes', () => {
    class A {
      public a: number;
      constructor() {
        this.a = 1;
        (this as any)[Symbol.for('a')] = 2;
      }
      public ma() {
        // no-op
      }
    }
    expect(stringify(new A())).toEqual('{"a":1,[Symbol.for("a")]:2}');

    class AA {
      public a = 0;
    }
    expect(stringify(new AA())).toEqual('{"a":0}');
  });
  it('Should be able to stringify instances of classes inheriting from others', () => {
    class A {
      public a: number;
      constructor() {
        this.a = 1;
        (this as any)[Symbol.for('a')] = 2;
      }
      public ma() {
        // no-op
      }
    }
    class B extends A {
      public b;
      constructor() {
        super();
        this.b = 3;
        (this as any)[Symbol.for('b')] = 4;
      }
      public mb() {
        // no-op
      }
    }
    expect(stringify(new B())).toEqual('{"a":1,"b":3,[Symbol.for("a")]:2,[Symbol.for("b")]:4}');
  });
  it('Should be able to stringify Object without prototype', () => {
    expect(stringify(Object.create(null))).toEqual('Object.create(null)');
    expect(stringify(Object.assign(Object.create(null), { a: 1 }))).toEqual(
      'Object.assign(Object.create(null),{"a":1})'
    );
    expect(stringify(Object.assign(Object.create(null), { [Symbol.for('a')]: 1 }))).toEqual(
      'Object.assign(Object.create(null),{[Symbol.for("a")]:1})'
    );
  });
  it('Should be able to stringify Object with custom __proto__ value', () => {
    expect(stringify({ ['__proto__']: 1 })).toEqual('{["__proto__"]:1}');
    // NOTE: {__proto__: 1} and {'__proto__': 1} are not the same as {['__proto__']: 1}
  });
  it('Should be able to stringify Buffer', () => {
    expect(stringify(Buffer.from([1, 2, 3, 4]))).toEqual('Buffer.from([1,2,3,4])');
    expect(stringify(Buffer.alloc(3))).toEqual('Buffer.from([0,0,0])');
    expect(stringify(Buffer.alloc(4, 'a'))).toEqual('Buffer.from([97,97,97,97])');
    fc.assert(
      fc.property(fc.array(fc.nat(255)), (data) => {
        const buffer = Buffer.from(data);
        const stringifiedBuffer = stringify(buffer);
        const bufferFromStringified = eval(stringifiedBuffer);
        return Buffer.isBuffer(bufferFromStringified) && buffer.equals(bufferFromStringified);
      })
    );
  });
  it('Should be able to stringify a polyfill-ed Buffer', () => {
    const buffer = NotNodeBuffer.from([1, 2, 3, 4]);
    expect(NotNodeBuffer).not.toBe(Buffer);
    expect(buffer instanceof NotNodeBuffer).toBe(true);
    expect(buffer instanceof Buffer).toBe(false);
    expect(stringify(buffer)).toEqual('Buffer.from([1,2,3,4])');
  });
  it('Should be able to stringify Int8Array', () => {
    expect(stringify(Int8Array.from([-128, 5, 127]))).toEqual('Int8Array.from([-128,5,127])');
    assertStringifyTypedArraysProperly(fc.integer(-128, 127), Int8Array.from.bind(Int8Array));
  });
  it('Should be able to stringify Uint8Array', () => {
    expect(stringify(Uint8Array.from([255, 0, 5, 127]))).toEqual('Uint8Array.from([255,0,5,127])');
    assertStringifyTypedArraysProperly(fc.integer(0, 255), Uint8Array.from.bind(Uint8Array));
  });
  it('Should be able to stringify Int16Array', () => {
    expect(stringify(Int16Array.from([-32768, 5, 32767]))).toEqual('Int16Array.from([-32768,5,32767])');
    assertStringifyTypedArraysProperly(fc.integer(-32768, 32767), Int16Array.from.bind(Int16Array));
  });
  it('Should be able to stringify Uint16Array', () => {
    expect(stringify(Uint16Array.from([65535, 0, 5, 32767]))).toEqual('Uint16Array.from([65535,0,5,32767])');
    assertStringifyTypedArraysProperly(fc.integer(0, 65535), Uint16Array.from.bind(Uint16Array));
  });
  it('Should be able to stringify Int32Array', () => {
    expect(stringify(Int32Array.from([-2147483648, 5, 2147483647]))).toEqual(
      'Int32Array.from([-2147483648,5,2147483647])'
    );
    assertStringifyTypedArraysProperly(fc.integer(-2147483648, 2147483647), Int32Array.from.bind(Int32Array));
  });
  it('Should be able to stringify Uint32Array', () => {
    expect(stringify(Uint32Array.from([4294967295, 0, 5, 2147483647]))).toEqual(
      'Uint32Array.from([4294967295,0,5,2147483647])'
    );
    assertStringifyTypedArraysProperly(fc.integer(0, 4294967295), Uint32Array.from.bind(Uint32Array));
  });
  it('Should be able to stringify Float32Array', () => {
    expect(stringify(Float32Array.from([0, 0.5, 30, -1]))).toEqual('Float32Array.from([0,0.5,30,-1])');
    assertStringifyTypedArraysProperly(fc.float(), Float32Array.from.bind(Float32Array));
  });
  it('Should be able to stringify Float64Array', () => {
    expect(stringify(Float64Array.from([0, 0.5, 30, -1]))).toEqual('Float64Array.from([0,0.5,30,-1])');
    assertStringifyTypedArraysProperly(fc.double(), Float64Array.from.bind(Float64Array));
  });
  if (typeof BigInt !== 'undefined') {
    it('Should be able to stringify BigInt64Array', () => {
      expect(stringify(BigInt64Array.from([BigInt(-2147483648), BigInt(5), BigInt(2147483647)]))).toEqual(
        'BigInt64Array.from([-2147483648n,5n,2147483647n])'
      );
      assertStringifyTypedArraysProperly<bigint>(fc.bigIntN(64), BigInt64Array.from.bind(BigInt64Array));
    });
    it('Should be able to stringify BigUint64Array', () => {
      expect(stringify(BigUint64Array.from([BigInt(0), BigInt(5), BigInt(2147483647)]))).toEqual(
        'BigUint64Array.from([0n,5n,2147483647n])'
      );
      assertStringifyTypedArraysProperly<bigint>(fc.bigUintN(64), BigUint64Array.from.bind(BigUint64Array));
    });
  }
  it('Should be only produce toStringTag for failing toString', () => {
    expect(stringify(new ThrowingToString())).toEqual('[object Object]');
    expect(stringify(new CustomTagThrowingToString())).toEqual('[object CustomTagThrowingToString]');
    // TODO Move to getter-based implementation instead - es5 required
    const instance = Object.create(null);
    Object.defineProperty(instance, 'toString', {
      get: () => {
        throw new Error('No such accessor');
      },
    });
    expect(stringify(instance)).toEqual('[object Object]');
  });
});

describe('possiblyAsyncStringify', () => {
  it('Should behave as "stringify" for synchronous values produced by fc.anything()', () =>
    fc.assert(
      fc.property(fc.anything(anythingEnableAll), (value) => {
        const expectedStringifiedValue = stringify(value);
        const stringifiedValue = possiblyAsyncStringify(value);
        expect(typeof stringifiedValue).toBe('string');
        expect(stringifiedValue as string).toBe(expectedStringifiedValue);
      })
    ));
});

describe('asyncStringify', () => {
  it('Should return the same string as "stringify" for synchronous values produced by fc.anything()', () =>
    fc.assert(
      fc.asyncProperty(fc.anything(anythingEnableAll), async (value) => {
        const expectedStringifiedValue = stringify(value);
        const stringifiedValue = asyncStringify(value);
        expect(typeof stringifiedValue).not.toBe('string');
        expect(await stringifiedValue).toBe(expectedStringifiedValue);
      })
    ));
});

// Helpers

function assertStringifyTypedArraysProperly<TNumber>(
  arb: fc.Arbitrary<TNumber>,
  typedArrayProducer: (data: TNumber[]) => { values: () => IterableIterator<TNumber>; [Symbol.toStringTag]: string }
): void {
  fc.assert(
    fc.property(fc.array(arb), (data) => {
      const typedArray = typedArrayProducer(data);
      const stringifiedTypedArray = stringify(typedArray);
      const typedArrayFromStringified: typeof typedArray = eval(stringifiedTypedArray);
      expect(typedArrayFromStringified[Symbol.toStringTag]).toEqual(typedArray[Symbol.toStringTag]);
      expect([...typedArrayFromStringified.values()]).toEqual([...typedArray.values()]);
    })
  );
}
