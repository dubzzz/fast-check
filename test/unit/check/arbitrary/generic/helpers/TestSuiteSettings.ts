import fc from '../../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../../src/check/arbitrary/definition/Arbitrary';

export type ArbitraryBuilder<T, U> = {
  builder: (u: U) => Arbitrary<T>;
  seed: fc.Arbitrary<U>;
};

type Cmp<T> = (a: T, b: T) => boolean | void;
type ThrowCmp<T> = (a: T, b: T) => void;

export type TestSuiteSettings<T, U = any> = {
  arbitrary: ArbitraryBuilder<T, U> | Arbitrary<T>;
  equal?: Cmp<T>;
};

export function buildEq<T>(eq?: Cmp<T>): ThrowCmp<T> {
  return eq
    ? buildCmp(eq, 'equal')
    : (a: T, b: T) => {
        expect(a).toEqual(b);
      };
}
export function buildNotEq<T>(eq?: Cmp<T>): ThrowCmp<T> {
  return eq
    ? buildNotCmp(eq, 'equal')
    : (a: T, b: T) => {
        expect(a).not.toStrictEqual(b);
      };
}
export function buildCmp<T>(cmp: Cmp<T>, label: string): ThrowCmp<T> {
  return (a: T, b: T) => {
    if (!cmp(a, b)) throw new Error(`<a> is not ${label} to <b>\na = ${fc.stringify(a)}\nb = ${fc.stringify(b)}`);
  };
}
export function buildNotCmp<T>(cmp: Cmp<T>, label: string): ThrowCmp<T> {
  return (a: T, b: T) => {
    if (cmp(a, b)) throw new Error(`<a> is ${label} to <b>\na = ${fc.stringify(a)}\nb = ${fc.stringify(b)}`);
  };
}
