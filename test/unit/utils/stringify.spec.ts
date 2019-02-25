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

describe('stringify', () => {
  it('Should be able to stringify fc.anything()', () =>
    fc.assert(fc.property(fc.anything(), a => typeof stringify(a) === 'string')));
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
      fc.property(fc.anything(), obj => {
        expect(eval(`(function() { return ${stringify(obj)}; })()`)).toStrictEqual(obj);
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
    let cyclic: any = { a: 1, b: 2, c: 3 };
    cyclic.b = cyclic;
    const repr = stringify(cyclic);
    expect(repr).toContain('"a"');
    expect(repr).toContain('"b"');
    expect(repr).toContain('"c"');
    expect(repr).toContain('[cyclic]');
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
  it('Should be able to stringify Set', () => {
    expect(stringify(new Set([1, 2]))).toEqual('new Set([1,2])');
  });
  it('Should be able to stringify Map', () => {
    expect(stringify(new Map([[1, 2]]))).toEqual('new Map([[1,2]])');
  });
});
