import { Arbitrary } from './definition/Arbitrary';
import { doubleNext, DoubleNextConstraints } from './DoubleNextArbitrary';
import { floatNext, FloatNextConstraints } from './FloatNextArbitrary';
import { integer } from './IntegerArbitrary';
import { tuple } from './TupleArbitrary';

/** @internal */
function next(n: number): Arbitrary<number> {
  return integer(0, (1 << n) - 1);
}

/** @internal */
const floatInternal = (): Arbitrary<number> => {
  // uniformaly in the range 0 (inc.), 1 (exc.)
  return next(24).map((v) => v / (1 << 24));
};

/**
 * Constraints to be applied on {@link float}
 * @public
 */
export type FloatConstraints =
  | {
      /** Enable new version of fc.float */
      next?: false;
      /** Lower bound for the generated floats (included) */
      min?: number;
      /** Upper bound for the generated floats (excluded) */
      max?: number;
    }
  | ({
      /** Enable new version of fc.float */
      next: true;
    } & FloatNextConstraints);

/**
 * For floating point numbers between 0.0 (included) and 1.0 (excluded) - accuracy of `1 / 2**24`
 * @public
 */
function float(): Arbitrary<number>;
/**
 * For floating point numbers between 0.0 (included) and max (excluded) - accuracy of `max / 2**24`
 *
 * @param max - Upper bound of the generated floating point
 *
 * @deprecated
 * Superceded by `fc.float({max})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function float(max: number): Arbitrary<number>;
/**
 * For floating point numbers between min (included) and max (excluded) - accuracy of `(max - min) / 2**24`
 *
 * @param min - Lower bound of the generated floating point
 * @param max - Upper bound of the generated floating point
 *
 * @remarks
 * You may prefer to use `fc.float({min, max})` instead.
 *
 * @public
 */
function float(min: number, max: number): Arbitrary<number>;
/**
 * For floating point numbers in range defined by constraints - accuracy of `(max - min) / 2**24`
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function float(constraints: FloatConstraints): Arbitrary<number>;
function float(...args: [] | [number] | [number, number] | [FloatConstraints]): Arbitrary<number> {
  if (typeof args[0] === 'object') {
    if (args[0].next) {
      return floatNext(args[0]);
    }
    const min = args[0].min !== undefined ? args[0].min : 0;
    const max = args[0].max !== undefined ? args[0].max : 1;
    return floatInternal().map((v) => min + v * (max - min));
  } else {
    const a = args[0];
    const b = args[1];
    if (a === undefined) return floatInternal();
    if (b === undefined) return floatInternal().map((v) => v * a);
    return floatInternal().map((v) => a + v * (b - a));
  }
}

/** @internal */ const doubleFactor = Math.pow(2, 27);
/** @internal */ const doubleDivisor = Math.pow(2, -53);

/** @internal */
const doubleInternal = (): Arbitrary<number> => {
  // uniformaly in the range 0 (inc.), 1 (exc.)
  return tuple(next(26), next(27)).map((v) => (v[0] * doubleFactor + v[1]) * doubleDivisor);
};

/**
 * Constraints to be applied on {@link double}
 * @public
 */
export type DoubleConstraints =
  | {
      /** Enable new version of fc.double */
      next?: false;
      /** Lower bound for the generated doubles (included) */
      min?: number;
      /** Upper bound for the generated doubles (excluded) */
      max?: number;
    }
  | ({
      /** Enable new version of fc.double */
      next: true;
    } & DoubleNextConstraints);

/**
 * For floating point numbers between 0.0 (included) and 1.0 (excluded) - accuracy of `1 / 2**53`
 * @public
 */
function double(): Arbitrary<number>;
/**
 * For floating point numbers between 0.0 (included) and max (excluded) - accuracy of `max / 2**53`
 *
 * @param max - Upper bound of the generated floating point
 *
 * @deprecated
 * Superceded by `fc.double({max})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function double(max: number): Arbitrary<number>;
/**
 * For floating point numbers between min (included) and max (excluded) - accuracy of `(max - min) / 2**53`
 *
 * @param min - Lower bound of the generated floating point
 * @param max - Upper bound of the generated floating point
 *
 * @remarks
 * You may prefer to use `fc.double({min, max})` instead.
 *
 * @public
 */
function double(min: number, max: number): Arbitrary<number>;
/**
 * For floating point numbers in range defined by constraints - accuracy of `(max - min) / 2**53`
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function double(constraints: DoubleConstraints): Arbitrary<number>;
function double(...args: [] | [number] | [number, number] | [DoubleConstraints]): Arbitrary<number> {
  if (typeof args[0] === 'object') {
    if (args[0].next) {
      return doubleNext(args[0]);
    }
    const min = args[0].min !== undefined ? args[0].min : 0;
    const max = args[0].max !== undefined ? args[0].max : 1;
    return doubleInternal().map((v) => min + v * (max - min));
  } else {
    const a = args[0];
    const b = args[1];
    if (a === undefined) return doubleInternal();
    if (b === undefined) return doubleInternal().map((v) => v * a);
    return doubleInternal().map((v) => a + v * (b - a));
  }
}

export { float, double };
