import Arbitrary from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';
import { tuple } from './TupleArbitrary';

function next(n: number): Arbitrary<number> {
  return integer(0, (1 << n) - 1);
}

const floatInternal = (): Arbitrary<number> => {
  // uniformaly in the range 0 (inc.), 1 (exc.)
  return next(24).map(v => v / (1 << 24));
};

function float(): Arbitrary<number>;
function float(max: number): Arbitrary<number>;
function float(min: number, max: number): Arbitrary<number>;
function float(a?: number, b?: number): Arbitrary<number> {
  if (a === undefined) return floatInternal();
  if (b === undefined) return floatInternal().map(v => v * a);
  return floatInternal().map(v => a + v * (b - a));
}

const doubleFactor = Math.pow(2, 27);
const doubleDivisor = Math.pow(2, -53);

const doubleInternal = (): Arbitrary<number> => {
  // uniformaly in the range 0 (inc.), 1 (exc.)
  return tuple(next(26), next(27)).map(v => (v[0] * doubleFactor + v[1]) * doubleDivisor);
};

function double(): Arbitrary<number>;
function double(max: number): Arbitrary<number>;
function double(min: number, max: number): Arbitrary<number>;
function double(a?: number, b?: number): Arbitrary<number> {
  if (a === undefined) return doubleInternal();
  if (b === undefined) return doubleInternal().map(v => v * a);
  return doubleInternal().map(v => a + v * (b - a));
}

export { float, double };
