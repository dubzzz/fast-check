import * as fc from '../../../src/fast-check';

type M1 = { count: number };
type R1 = {};

export class IncreaseCommand implements fc.Command<M1, R1> {
  constructor(readonly n: number) {}
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {
    m.count += this.n;
  };
  toString = () => `inc[${this.n}]`;
}
export class DecreaseCommand implements fc.Command<M1, R1> {
  constructor(readonly n: number) {}
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {
    m.count -= this.n;
  };
  toString = () => `dec[${this.n}]`;
}
export class EvenCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => m.count % 2 === 0;
  run = (m: M1, r: R1) => {};
  toString = () => 'even';
}
export class OddCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => m.count % 2 !== 0;
  run = (m: M1, r: R1) => {};
  toString = () => 'odd';
}
export class CheckLessThanCommand implements fc.Command<M1, R1> {
  constructor(readonly lessThanValue: number) {}
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {
    expect(m.count).toBeLessThan(this.lessThanValue);
  };
  toString = () => `check[${this.lessThanValue}]`;
}
export class SuccessAlwaysCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {};
  toString = () => 'success';
}
