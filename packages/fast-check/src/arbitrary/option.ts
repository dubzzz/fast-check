import { constant } from './constant.js';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import type { _Constraints as FrequencyConstraints } from './_internals/FrequencyArbitrary.js';
import { FrequencyArbitrary } from './_internals/FrequencyArbitrary.js';
import type { DepthIdentifier } from './_internals/helpers/DepthContext.js';
import type { DepthSize } from './_internals/helpers/MaxLengthFromMinLength.js';
import { safeHasOwnProperty } from '../utils/globals.js';

/**
 * Constraints to be applied on {@link option}
 * @remarks Since 2.2.0
 * @public
 */
export interface OptionConstraints<TNil = null> {
  /**
   * The probability to build a nil value is of `1 / freq`.
   *
   * `Number.POSITIVE_INFINITY` is accepted as a way to request a probability of nil equal to zero:
   * the arbitrary will never produce nil on its own. Nil may still be produced when other constraints
   * force it — for instance once `maxDepth` has been reached (see below).
   * @defaultValue 6
   * @remarks Since 1.17.0
   */
  freq?: number;
  /**
   * The nil value
   * @defaultValue null
   * @remarks Since 1.17.0
   */
  nil?: TNil;
  /**
   * While going deeper and deeper within a recursive structure (see {@link letrec}),
   * this factor will be used to increase the probability to generate nil.
   *
   * @remarks Since 2.14.0
   */
  depthSize?: DepthSize;
  /**
   * Maximal authorized depth. Once this depth has been reached only nil will be used.
   * @defaultValue Number.POSITIVE_INFINITY — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 2.14.0
   */
  maxDepth?: number;
  /**
   * Depth identifier can be used to share the current depth between several instances.
   *
   * By default, if not specified, each instance of option will have its own depth.
   * In other words: you can have depth=1 in one while you have depth=100 in another one.
   *
   * @remarks Since 2.14.0
   */
  depthIdentifier?: DepthIdentifier | string;
}

/**
 * For either nil or a value coming from `arb` with custom frequency
 *
 * @param arb - Arbitrary that will be called to generate a non nil value
 * @param constraints - Constraints on the option(since 1.17.0)
 *
 * @remarks Since 0.0.6
 * @public
 */
export function option<T, TNil = null>(
  arb: Arbitrary<T>,
  constraints: OptionConstraints<TNil> = {},
): Arbitrary<T | TNil> {
  const freq = constraints.freq === undefined ? 6 : constraints.freq;
  const nilValue = safeHasOwnProperty(constraints, 'nil') ? constraints.nil : (null as any);
  // `freq: Number.POSITIVE_INFINITY` is the only non-finite value we special-case: it means
  // "probability of nil is zero" so we swap in a {nil: 0, arb: 1} weighting instead of computing
  // `freq - 1` (which would be +Infinity, rejected by FrequencyArbitrary as a non-integer weight).
  // Every other value (including NaN and -Infinity) keeps going through `freq - 1` unchanged, so it
  // is rejected by FrequencyArbitrary exactly as it always has been.
  const isNeverNil = freq === Number.POSITIVE_INFINITY;
  const nilArb = constant(nilValue);
  const weightedArbs = [
    { arbitrary: nilArb, weight: isNeverNil ? 0 : 1, fallbackValue: { default: nilValue } },
    { arbitrary: arb, weight: isNeverNil ? 1 : freq - 1 },
  ];
  const frequencyConstraints: FrequencyConstraints = {
    withCrossShrink: true,
    depthSize: constraints.depthSize,
    maxDepth: constraints.maxDepth,
    depthIdentifier: constraints.depthIdentifier,
  };
  return FrequencyArbitrary.from(weightedArbs, frequencyConstraints, 'fc.option');
}
