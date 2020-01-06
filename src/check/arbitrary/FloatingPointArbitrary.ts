import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';
import { tuple } from './TupleArbitrary';

/** @internal */
function next(n: number): Arbitrary<number> {
  return integer(0, (1 << n) - 1);
}

/** @internal */
const floatInternal = (): Arbitrary<number> => {
  // uniformaly in the range 0 (inc.), 1 (exc.)
  return next(24).map(v => v / (1 << 24));
};

/**
 * For floating point numbers between 0.0 (included) and 1.0 (excluded) - accuracy of `1 / 2**24`
 */
function float(): Arbitrary<number>;
/**
 * For floating point numbers between 0.0 (included) and max (excluded) - accuracy of `max / 2**24`
 * @param max Upper bound of the generated floating point
 */
function float(max: number): Arbitrary<number>;
/**
 * For floating point numbers between min (included) and max (excluded) - accuracy of `(max - min) / 2**24`
 * @param min Lower bound of the generated floating point
 * @param max Upper bound of the generated floating point
 */
function float(min: number, max: number): Arbitrary<number>;
function float(a?: number, b?: number): Arbitrary<number> {
  if (a === undefined) return floatInternal();
  if (b === undefined) return floatInternal().map(v => v * a);
  return floatInternal().map(v => a + v * (b - a));
}

/** @internal */ const doubleFactor = Math.pow(2, 27);
/** @internal */ const doubleDivisor = Math.pow(2, -53);

/** @internal */
const doubleInternal = (): Arbitrary<number> => {
  // uniformaly in the range 0 (inc.), 1 (exc.)
  return tuple(next(26), next(27)).map(v => (v[0] * doubleFactor + v[1]) * doubleDivisor);
};

/**
 * For floating point numbers between 0.0 (included) and 1.0 (excluded) - accuracy of `1 / 2**53`
 */
function double(): Arbitrary<number>;
/**
 * For floating point numbers between 0.0 (included) and max (excluded) - accuracy of `max / 2**53`
 * @param max Upper bound of the generated floating point
 */
function double(max: number): Arbitrary<number>;
/**
 * For floating point numbers between min (included) and max (excluded) - accuracy of `(max - min) / 2**53`
 * @param min Lower bound of the generated floating point
 * @param max Upper bound of the generated floating point
 */
function double(min: number, max: number): Arbitrary<number>;
function double(a?: number, b?: number): Arbitrary<number> {
  if (a === undefined) return doubleInternal();
  if (b === undefined) return doubleInternal().map(v => v * a);
  return doubleInternal().map(v => a + v * (b - a));
}

export { float, double };
