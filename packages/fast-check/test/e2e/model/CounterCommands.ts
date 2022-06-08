import * as fc from '../../../src/fast-check';

type M1 = { count: number };
type R1 = unknown;

export class IncreaseCommand implements fc.Command<M1, R1> {
  constructor(readonly n: number) {}
  check = (_m: Readonly<M1>): boolean => true;
  run = (m: M1, _r: R1): void => {
    m.count += this.n;
  };
  toString = (): string => `inc[${this.n}]`;
}
export class DecreaseCommand implements fc.Command<M1, R1> {
  constructor(readonly n: number) {}
  check = (_m: Readonly<M1>): boolean => true;
  run = (m: M1, _r: R1): void => {
    m.count -= this.n;
  };
  toString = (): string => `dec[${this.n}]`;
}
export class EvenCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>): boolean => m.count % 2 === 0;
  run = (_m: M1, _r: R1): void => {};
  toString = (): string => 'even';
}
export class OddCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>): boolean => m.count % 2 !== 0;
  run = (_m: M1, _r: R1): void => {};
  toString = (): string => 'odd';
}
export class CheckLessThanCommand implements fc.Command<M1, R1> {
  constructor(readonly lessThanValue: number) {}
  check = (_m: Readonly<M1>): boolean => true;
  run = (m: M1, _r: R1): void => {
    expect(m.count).toBeLessThan(this.lessThanValue);
  };
  toString = (): string => `check[${this.lessThanValue}]`;
}
export class SuccessAlwaysCommand implements fc.Command<M1, R1> {
  check = (_m: Readonly<M1>): boolean => true;
  run = (_m: M1, _r: R1): void => {};
  toString = (): string => 'success';
}
