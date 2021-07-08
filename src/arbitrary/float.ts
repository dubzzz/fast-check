import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { floatNext, FloatNextConstraints } from './_next/floatNext';
import { integer } from './integer';

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
 * @remarks Since 2.6.0
 * @public
 */
export type FloatConstraints =
  | {
      /**
       * Enable new version of fc.float
       * @remarks Since 2.8.0
       */
      next?: false;
      /**
       * Lower bound for the generated floats (included)
       * @remarks Since 2.6.0
       */
      min?: number;
      /**
       * Upper bound for the generated floats (excluded)
       * @remarks Since 2.6.0
       */
      max?: number;
    }
  | ({
      /**
       * Enable new version of fc.float
       * @remarks Since 2.8.0
       */
      next: true;
    } & FloatNextConstraints);

/**
 * For floating point numbers between 0.0 (included) and 1.0 (excluded) - accuracy of `1 / 2**24`
 * @remarks Since 0.0.6
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
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.0.0
 * @public
 */
function float(max: number): Arbitrary<number>;
/**
 * For floating point numbers between min (included) and max (excluded) - accuracy of `(max - min) / 2**24`
 *
 * @param min - Lower bound of the generated floating point
 * @param max - Upper bound of the generated floating point
 *
 * @remarks You may prefer to use `fc.float({min, max})` instead.
 * @remarks Since 1.0.0
 * @public
 */
function float(min: number, max: number): Arbitrary<number>;
/**
 * For floating point numbers in range defined by constraints - accuracy of `(max - min) / 2**24`
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
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
    return (
      floatInternal()
        .map((v) => min + v * (max - min))
        // For v = 0.9999999403953552, min: 0, max: 5e-324
        // we have `min + v * (max - min)` equal to `max`
        .filter((g) => g !== max || g === min)
    );
  } else {
    const a = args[0];
    const b = args[1];
    if (a === undefined) return floatInternal();
    if (b === undefined)
      return (
        floatInternal()
          .map((v) => v * a)
          // For v = 0.9999999403953552, a: 5e-324
          // we have `v * a` equal to `a`
          .filter((g) => g !== a || g === 0)
      );
    return (
      floatInternal()
        .map((v) => a + v * (b - a))
        // For v = 0.9999999403953552, a: 0, b: 5e-324
        // we have `a + v * (b - a)` equal to `b`
        .filter((g) => g !== b || g === a)
    );
  }
}
export { float };
