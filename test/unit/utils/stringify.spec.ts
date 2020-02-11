import * as fc from '../../../lib/fast-check';

import { stringify } from '../../../src/utils/stringify';

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
  withNullPrototype: true
};

describe('stringify', () => {
  it('Should be able to stringify fc.anything()', () =>
    fc.assert(fc.property(fc.anything(anythingEnableAll), a => typeof stringify(a) === 'string')));
  it('Should be able to stringify fc.char16bits() (ie. possibly invalid strings)', () =>
    fc.assert(fc.property(fc.char16bits(), a => typeof stringify(a) === 'string')));
  if (typeof BigInt !== 'undefined') {
    it('Should be able to stringify bigint in object correctly', () =>
      fc.assert(fc.property(fc.bigInt(), b => stringify({ b }) === '{"b":' + b + 'n}')));
  }
  it('Should be equivalent to JSON.stringify for JSON compliant objects', () =>
    fc.assert(
      fc.property(
        fc.anything({ values: [fc.boolean(), fc.integer(), fc.double(), fc.fullUnicodeString(), fc.constant(null)] }),
        obj => {
          expect(stringify(obj)).toEqual(JSON.stringify(obj));
        }
      )
    ));
  it('Should be readable from eval', () =>
    fc.assert(
      fc.property(fc.anything(anythingEnableAll), obj => {
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
  it('Should be able to stringify Object without prototype', () => {
    expect(stringify(Object.create(null))).toEqual('Object.create(null)');
    expect(stringify(Object.assign(Object.create(null), { a: 1 }))).toEqual(
      'Object.assign(Object.create(null),{"a":1})'
    );
  });
  it('Should be able to stringify Object with custom __proto__ value', () => {
    // TODO Remove eval(...) - ts-jest seems not to properly transpile { ['__proto__']: 1 } when targeting es3
    // expect(stringify({ ['__proto__']: 1 })).toEqual('{["__proto__"]:1}');
    expect(stringify(eval("({ ['__proto__']: 1 })"))).toEqual('{["__proto__"]:1}');
    // NOTE: {__proto__: 1} and {'__proto__': 1} are not the same as {['__proto__']: 1}
  });
  it('Should be only produce toStringTag for failing toString', () => {
    expect(stringify(new ThrowingToString())).toEqual('[object Object]');
    expect(stringify(new CustomTagThrowingToString())).toEqual('[object CustomTagThrowingToString]');
    // TODO Move to getter-based implementation instead - es5 required
    const instance = Object.create(null);
    Object.defineProperty(instance, 'toString', {
      get: () => {
        throw new Error('No such accessor');
      }
    });
    expect(stringify(instance)).toEqual('[object Object]');
  });
});
