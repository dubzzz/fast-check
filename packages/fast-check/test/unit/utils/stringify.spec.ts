import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Importing 'buffer' imports the real implementation from node
// Instead we want 'buffer' from our node_modules - the most used polyfill for Buffer on browser-side
import { Buffer as NotNodeBuffer } from 'not-node-buffer';

import {
  asyncStringify,
  asyncToStringMethod,
  possiblyAsyncStringify,
  stringify,
  toStringMethod,
} from '../../../src/utils/stringify';

declare function BigInt(n: number | bigint | string): bigint;

const checkEqual = (a: any, b: any): boolean => {
  try {
    expect(a).toEqual(b);
    return true;
  } catch {
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

const anythingEnableAll: fc.ObjectConstraints = {
  withBoxedValues: true,
  withMap: true,
  withSet: true,
  withObjectString: true,
  withNullPrototype: true,
  withDate: true,
  withTypedArray: true,
  withSparseArray: true,
  withUnicodeString: true,
  withBigInt: true,
};

describe('stringify', () => {
  it('Should be able to stringify fc.anything()', () =>
    fc.assert(fc.property(fc.anything(anythingEnableAll), (a) => typeof stringify(a) === 'string')));
  it('Should be able to stringify possibly invalid strings', () =>
    fc.assert(
      fc.property(
        fc.string({ unit: fc.nat({ max: 0xffff }).map((n) => String.fromCharCode(n)) }),
        (a) => typeof stringify(a) === 'string',
      ),
    ));
  it('Should be able to stringify bigint in object correctly', () =>
    fc.assert(fc.property(fc.bigInt(), (b) => stringify({ b }) === '{"b":' + b + 'n}')));
  it('Should be equivalent to JSON.stringify for JSON compliant objects', () =>
    fc.assert(
      fc.property(
        // Remark: While fc.jsonValue() could have been a good alternative to fc.anything()
        //         it unfortunately cannot be used as JSON.stringify poorly handles negative zeros.
        // JSON.parse('{"a": -0}') -> preserves -0
        // JSON.stringify({a: -0}) -> changes -0 into 0, it produces {"a":0}
        fc.anything({
          key: fc.string().filter((k) => k !== '__proto__'),
          values: [
            fc.boolean(),
            fc.integer(),
            fc.double({ noDefaultInfinity: true, noNaN: true }).filter((d) => !Object.is(d, -0)),
            fc.string({ unit: 'binary' }),
            fc.constant(null),
          ],
        }),
        (obj) => {
          expect(stringify(obj)).toEqual(JSON.stringify(obj));
        },
      ),
    ));
  it('Should be readable from eval', () =>
    fc.assert(
      fc.property(fc.anything(anythingEnableAll), (obj) => {
        expect(eval(`(function() { return ${stringify(obj)}; })()`)).toStrictEqual(obj as any);
      }),
    ));
  it('Should stringify differently distinct objects', () =>
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (a, b) => {
        fc.pre(!checkEqual(a, b));
        expect(stringify(a)).not.toEqual(stringify(b));
      }),
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
    expect(stringify(Array(10000))).toEqual('Array(10000)');
    expect(stringify(Array(4294967295))).toEqual('Array(4294967295)');
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
    expect(stringify(BigInt(42))).toEqual('42n');
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

        expect(stringify(s)).toEqual(
          Number(process.versions.node.split('.')[0]) < 23 &&
            (symbolName === 'dispose' || symbolName === 'asyncDispose')
            ? `Symbol.for("nodejs.${symbolName}")`
            : `Symbol.${symbolName}`,
        );
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
    expect(stringify(Object.create(null))).toEqual('{__proto__:null}');
    expect(stringify(Object.assign(Object.create(null), { a: 1 }))).toEqual('{__proto__:null,"a":1}');
    expect(stringify(Object.assign(Object.create(null), { [Symbol.for('a')]: 1 }))).toEqual(
      '{__proto__:null,[Symbol.for("a")]:1}',
    );
  });
  it('Should be able to stringify Object with custom __proto__ value', () => {
    expect(stringify({ ['__proto__']: 1 })).toEqual('{["__proto__"]:1}');
    // NOTE: {__proto__: 1} and {'__proto__': 1} are not the same as {['__proto__']: 1}
  });
  it('Should be able to stringify Object with custom __proto__ value and no prototype', () => {
    const instance = Object.assign(Object.create(null), { ['__proto__']: 1 });
    expect(stringify(instance)).toEqual('{__proto__:null,["__proto__"]:1}');
    // NOTE: {['__proto__']: 1} is not the same as Object.assign(Object.create(null),{["__proto__"]:1})
    // The first one has a prototype equal to Object, the second one has no prototype.
  });
  it('Should be able to stringify Promise but not show its value or status in sync mode', () => {
    const p1 = Promise.resolve(1); // resolved
    const p2 = Promise.reject(1); // rejected
    const p3 = new Promise(() => {}); // unresolved (ie pending)

    expect(stringify(p1)).toEqual('new Promise(() => {/*unknown*/})');
    expect(stringify(p2)).toEqual('new Promise(() => {/*unknown*/})');
    expect(stringify(p3)).toEqual('new Promise(() => {/*unknown*/})');
    expect(stringify({ p1 })).toEqual('{"p1":new Promise(() => {/*unknown*/})}');

    [p1, p2, p3].map((p) => p.catch(() => {})); // no unhandled rejections
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
      }),
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
    assertStringifyTypedArraysProperly(fc.integer({ min: -128, max: 127 }), Int8Array.from.bind(Int8Array));
  });
  it('Should be able to stringify Uint8Array', () => {
    expect(stringify(Uint8Array.from([255, 0, 5, 127]))).toEqual('Uint8Array.from([255,0,5,127])');
    assertStringifyTypedArraysProperly(fc.integer({ min: 0, max: 255 }), Uint8Array.from.bind(Uint8Array));
  });
  it('Should be able to stringify Int16Array', () => {
    expect(stringify(Int16Array.from([-32768, 5, 32767]))).toEqual('Int16Array.from([-32768,5,32767])');
    assertStringifyTypedArraysProperly(fc.integer({ min: -32768, max: 32767 }), Int16Array.from.bind(Int16Array));
  });
  it('Should be able to stringify Uint16Array', () => {
    expect(stringify(Uint16Array.from([65535, 0, 5, 32767]))).toEqual('Uint16Array.from([65535,0,5,32767])');
    assertStringifyTypedArraysProperly(fc.integer({ min: 0, max: 65535 }), Uint16Array.from.bind(Uint16Array));
  });
  it('Should be able to stringify Int32Array', () => {
    expect(stringify(Int32Array.from([-2147483648, 5, 2147483647]))).toEqual(
      'Int32Array.from([-2147483648,5,2147483647])',
    );
    assertStringifyTypedArraysProperly(
      fc.integer({ min: -2147483648, max: 2147483647 }),
      Int32Array.from.bind(Int32Array),
    );
  });
  it('Should be able to stringify Uint32Array', () => {
    expect(stringify(Uint32Array.from([4294967295, 0, 5, 2147483647]))).toEqual(
      'Uint32Array.from([4294967295,0,5,2147483647])',
    );
    assertStringifyTypedArraysProperly(fc.integer({ min: 0, max: 4294967295 }), Uint32Array.from.bind(Uint32Array));
  });
  it('Should be able to stringify Float32Array', () => {
    expect(stringify(Float32Array.from([0, 0.5, 30, -1]))).toEqual('Float32Array.from([0,0.5,30,-1])');
    assertStringifyTypedArraysProperly(fc.float(), Float32Array.from.bind(Float32Array));
  });
  it('Should be able to stringify Float64Array', () => {
    expect(stringify(Float64Array.from([0, 0.5, 30, -1]))).toEqual('Float64Array.from([0,0.5,30,-1])');
    assertStringifyTypedArraysProperly(fc.double(), Float64Array.from.bind(Float64Array));
  });
  it('Should be able to stringify BigInt64Array', () => {
    expect(stringify(BigInt64Array.from([BigInt(-2147483648), BigInt(5), BigInt(2147483647)]))).toEqual(
      'BigInt64Array.from([-2147483648n,5n,2147483647n])',
    );
    assertStringifyTypedArraysProperly<bigint>(fc.bigIntN(64), BigInt64Array.from.bind(BigInt64Array));
  });
  it('Should be able to stringify BigUint64Array', () => {
    expect(stringify(BigUint64Array.from([BigInt(0), BigInt(5), BigInt(2147483647)]))).toEqual(
      'BigUint64Array.from([0n,5n,2147483647n])',
    );
    assertStringifyTypedArraysProperly<bigint>(fc.bigUintN(64), BigUint64Array.from.bind(BigUint64Array));
  });
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
  it('Should use [toStringMethod] if any on the instance or its prototype', () => {
    const instance1 = { [toStringMethod]: () => 'hello1' };
    expect(stringify(instance1)).toEqual('hello1');

    const instance2 = Object.create(null);
    Object.defineProperty(instance2, toStringMethod, {
      value: () => 'hello2',
      configurable: false,
      enumerable: false,
      writable: false,
    });
    expect(stringify(instance2)).toEqual('hello2');

    // prettier-ignore
    const instance3 = { [toStringMethod]: () => { throw new Error('hello3'); } };
    const stringified3 = stringify(instance3);
    expect(stringified3.replace(/[\s\n]+/g, ' ')).toEqual(
      '{[Symbol.for("fast-check/toStringMethod")]:() => { throw new Error("hello3"); }}',
    ); // fallbacking to default

    class InProto {
      [toStringMethod]() {
        return 'hello4';
      }
    }
    const instance4 = new InProto();
    expect(stringify(instance4)).toEqual('hello4');

    const instance5 = { [toStringMethod]: 1 }; // not callable
    expect(stringify(instance5)).toEqual('{[Symbol.for("fast-check/toStringMethod")]:1}');
  });
  it('Should not be able to rely on the output of [asyncToStringMethod] in sync mode', () => {
    const instance1 = { [asyncToStringMethod]: () => 'hello1' }; // not even async there
    expect(stringify(instance1)).toEqual('{[Symbol.for("fast-check/asyncToStringMethod")]:() => "hello1"}'); // fallbacking to default

    const instance2 = { [asyncToStringMethod]: () => 'hello2', [toStringMethod]: () => 'world' };
    expect(stringify(instance2)).toEqual('world'); // fallbacking to [toStringMethod]

    const instance3ProbeFn = vi.fn();
    const instance3 = { [asyncToStringMethod]: instance3ProbeFn };
    stringify(instance3);
    expect(instance3ProbeFn).not.toHaveBeenCalled(); // never calling [asyncToStringMethod] in sync mode
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
      }),
    ));
  it('Should return the same string as "stringify" wrapped into Promise.resolve for Promises on values produced by fc.anything()', () =>
    fc.assert(
      fc.asyncProperty(fc.anything(anythingEnableAll), async (value) => {
        const expectedStringifiedValue = stringify(value);
        const stringifiedValue = possiblyAsyncStringify(Promise.resolve(value));
        expect(typeof stringifiedValue).not.toBe('string');
        expect(await stringifiedValue).toBe(`Promise.resolve(${expectedStringifiedValue})`);
      }),
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
      }),
    ));
  it('Should return the same string as "stringify" wrapped into Promise.resolve for Promises on values produced by fc.anything()', () =>
    fc.assert(
      fc.asyncProperty(fc.anything(anythingEnableAll), async (value) => {
        const expectedStringifiedValue = stringify(value);
        const stringifiedValue = asyncStringify(Promise.resolve(value));
        expect(typeof stringifiedValue).not.toBe('string');
        expect(await stringifiedValue).toBe(`Promise.resolve(${expectedStringifiedValue})`);
      }),
    ));

  it('Should be able to stringify resolved Promise', async () => {
    const p = Promise.resolve(1);
    expect(await asyncStringify(p)).toEqual('Promise.resolve(1)');
  });
  it('Should be able to stringify rejected Promise', async () => {
    const p = Promise.reject(1);
    expect(await asyncStringify(p)).toEqual('Promise.reject(1)');
    p.catch(() => {}); // no unhandled rejections
  });
  it('Should be able to stringify rejected Promise with Error', async () => {
    const p = Promise.reject(new Error('message'));
    expect(await asyncStringify(p)).toEqual('Promise.reject(new Error("message"))');
    p.catch(() => {}); // no unhandled rejections
  });
  it('Should be able to stringify pending Promise', async () => {
    const p = new Promise(() => {});
    expect(await asyncStringify(p)).toEqual('new Promise(() => {/*pending*/})');
  });
  it('Should be able to stringify Promise in other instances', async () => {
    const p1 = Promise.resolve(1);
    expect(await asyncStringify([p1])).toEqual('[Promise.resolve(1)]');
    expect(await asyncStringify(new Set([p1]))).toEqual('new Set([Promise.resolve(1)])');
    expect(await asyncStringify({ p1 })).toEqual('{"p1":Promise.resolve(1)}');
  });
  it('Should be able to stringify nested Promise', async () => {
    const nestedPromises = Promise.resolve({
      lvl1: Promise.resolve({
        lvl2: Promise.resolve(2),
      }),
    });
    expect(await asyncStringify(nestedPromises)).toEqual(
      'Promise.resolve({"lvl1":Promise.resolve({"lvl2":Promise.resolve(2)})})',
    );
  });
  it('Should be able to stringify self nested Promise', async () => {
    const resolvedValueChildLvl1 = {
      a1: Promise.resolve<unknown>(null),
    };
    const resolvedValue = {
      a: Promise.resolve(resolvedValueChildLvl1),
      b: { b1: Promise.resolve(resolvedValueChildLvl1) },
    };
    const nestedPromises = Promise.resolve(resolvedValue);
    resolvedValueChildLvl1.a1 = nestedPromises;
    expect(await asyncStringify(nestedPromises)).toEqual(
      'Promise.resolve({"a":Promise.resolve({"a1":[cyclic]}),"b":{"b1":Promise.resolve({"a1":[cyclic]})}})',
    );
  });
  it('Should use [asyncToStringMethod] if any on the instance or its prototype', async () => {
    const instance1 = { [asyncToStringMethod]: async () => 'hello1' };
    expect(await asyncStringify(instance1)).toEqual('hello1');

    const instance2 = Object.create(null);
    Object.defineProperty(instance2, asyncToStringMethod, {
      value: () => 'hello2',
      configurable: false,
      enumerable: false,
      writable: false,
    });
    expect(await asyncStringify(instance2)).toEqual('hello2');

    const instance3 = { [asyncToStringMethod]: async () => 'hello3', [toStringMethod]: () => 'world' };
    expect(await asyncStringify(instance3)).toEqual('hello3'); // even when [toStringMethod] has been defined

    // prettier-ignore
    const instance4 = { [asyncToStringMethod]: async () => { throw new Error('hello4'); } };
    const stringified4 = await asyncStringify(instance4);
    expect(stringified4.replace(/[\s\n]+/g, ' ')).toEqual(
      '{[Symbol.for("fast-check/asyncToStringMethod")]:async () => { throw new Error("hello4"); }}',
    ); // fallbacking to default

    // prettier-ignore
    const instance5 = { [asyncToStringMethod]: async () => { throw new Error('hello5'); }, [toStringMethod]: () => "world" };
    expect(await asyncStringify(instance5)).toEqual('world'); // fallbacking to [toStringMethod]

    // prettier-ignore
    const instance6 = { [asyncToStringMethod]: () => { throw new Error('hello6'); } }; // throw is sync
    const stringified6 = await asyncStringify(instance6);
    expect(stringified6.replace(/[\s\n]+/g, ' ')).toEqual(
      '{[Symbol.for("fast-check/asyncToStringMethod")]:() => { throw new Error("hello6"); }}',
    ); // fallbacking to default

    class InProto {
      async [asyncToStringMethod]() {
        return 'hello7';
      }
    }
    const instance7 = new InProto();
    expect(await asyncStringify(instance7)).toEqual('hello7');

    const instance8 = { [asyncToStringMethod]: 1 }; // not callable
    expect(await asyncStringify(instance8)).toEqual('{[Symbol.for("fast-check/asyncToStringMethod")]:1}');

    const instance9 = {
      [asyncToStringMethod]: async () => {
        const s1 = await asyncStringify(Promise.resolve('hello9'));
        const s2 = await asyncStringify(Promise.resolve('world9'));
        return `${s1} ${s2}`;
      },
    };
    expect(await asyncStringify(instance9)).toEqual('Promise.resolve("hello9") Promise.resolve("world9")');

    const p10 = Promise.resolve('hello10');
    const instance10 = { [asyncToStringMethod]: () => p10.then((v) => `got: ${v}`) };
    expect(await asyncStringify(instance10)).toEqual('got: hello10');
  });
});

// Helpers

function assertStringifyTypedArraysProperly<TNumber>(
  arb: fc.Arbitrary<TNumber>,
  typedArrayProducer: (data: TNumber[]) => { values: () => IterableIterator<TNumber>; [Symbol.toStringTag]: string },
): void {
  fc.assert(
    fc.property(fc.array(arb), (data) => {
      const typedArray = typedArrayProducer(data);
      const stringifiedTypedArray = stringify(typedArray);
      const typedArrayFromStringified: typeof typedArray = eval(stringifiedTypedArray);
      expect(typedArrayFromStringified[Symbol.toStringTag]).toEqual(typedArray[Symbol.toStringTag]);
      expect([...typedArrayFromStringified.values()]).toEqual([...typedArray.values()]);
    }),
  );
}
