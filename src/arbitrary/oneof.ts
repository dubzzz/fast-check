import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { WeightedArbitrary } from './frequency';
import { FrequencyArbitrary } from './_internals/FrequencyArbitrary';
import { DepthIdentifier } from './_internals/helpers/DepthContext';
import { DepthFactorSizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';

/**
 * Either an `Arbitrary<T>` or a `WeightedArbitrary<T>`
 * @remarks Since 3.0.0
 * @public
 */
type MaybeWeightedArbitrary<T> = Arbitrary<T> | WeightedArbitrary<T>;

/**
 * Infer the type of the Arbitrary produced by {@link oneof}
 * given the type of the source arbitraries
 *
 * @remarks Since 2.2.0
 * @public
 */
export type OneOfValue<Ts extends MaybeWeightedArbitrary<unknown>[]> = {
  [K in keyof Ts]: Ts[K] extends MaybeWeightedArbitrary<infer U> ? U : never;
}[number];

/**
 * Constraints to be applied on {@link oneof}
 * @remarks Since 2.14.0
 * @public
 */
export type OneOfConstraints = {
  /**
   * When set to true, the shrinker of oneof will try to check if the first arbitrary
   * could have been used to discover an issue. It allows to shrink trees.
   *
   * Warning: First arbitrary must be the one resulting in the smallest structures
   * for usages in deep tree-like structures.
   *
   * @remarks Since 2.14.0
   */
  withCrossShrink?: boolean;
  /**
   * While going deeper and deeper within a recursive structure (see {@link letrec}),
   * this factor will be used to increase the probability to generate instances
   * of the first passed arbitrary.
   *
   * @remarks Since 2.14.0
   */
  depthFactor?: DepthFactorSizeForArbitrary;
  /**
   * Maximal authorized depth.
   * Once this depth has been reached only the first arbitrary will be used.
   *
   * @remarks Since 2.14.0
   */
  maxDepth?: number;
  /**
   * Depth identifier can be used to share the current depth between several instances.
   *
   * By default, if not specified, each instance of oneof will have its own depth.
   * In other words: you can have depth=1 in one while you have depth=100 in another one.
   *
   * @remarks Since 2.14.0
   */
  depthIdentifier?: DepthIdentifier | string;
};

/**
 * @internal
 */
function isOneOfContraints(
  param: OneOfConstraints | MaybeWeightedArbitrary<unknown> | undefined
): param is OneOfConstraints {
  return (
    param != null &&
    typeof param === 'object' &&
    // Arbitrary<unknown>
    !('generate' in param) &&
    // WeightedArbitrary<unknown>
    !('arbitrary' in param) &&
    !('weight' in param)
  );
}

/**
 * For one of the values generated by `...arbs` - with all `...arbs` equiprobable
 *
 * **WARNING**: It expects at least one arbitrary
 *
 * @param arbs - Arbitraries that might be called to produce a value
 *
 * @remarks Since 0.0.1
 * @public
 */
function oneof<Ts extends MaybeWeightedArbitrary<unknown>[]>(...arbs: Ts): Arbitrary<OneOfValue<Ts>>;
/**
 * For one of the values generated by `...arbs` - with all `...arbs` equiprobable
 *
 * **WARNING**: It expects at least one arbitrary
 *
 * @param constraints - Constraints to be applied when generating the values
 * @param arbs - Arbitraries that might be called to produce a value
 *
 * @remarks Since 2.14.0
 * @public
 */
function oneof<Ts extends MaybeWeightedArbitrary<unknown>[]>(
  constraints: OneOfConstraints,
  ...arbs: Ts
): Arbitrary<OneOfValue<Ts>>;
function oneof<Ts extends MaybeWeightedArbitrary<unknown>[]>(
  ...args: [...Ts] | [OneOfConstraints, ...Ts]
): Arbitrary<OneOfValue<Ts>> {
  // TODO With TypeScript 4.0 it will be possible to properly define typings for `oneof(...arbs, constraints)`
  const constraints = args[0];
  if (isOneOfContraints(constraints)) {
    const weightedArbs = (args.slice(1) as Arbitrary<OneOfValue<Ts>>[]).map((arbitrary) => ({ arbitrary, weight: 1 }));
    return FrequencyArbitrary.from(weightedArbs, constraints, 'fc.oneof');
  }
  const weightedArbs = (args as MaybeWeightedArbitrary<OneOfValue<Ts>>[]).map(
    (maybeWeightedArbitrary): WeightedArbitrary<OneOfValue<Ts>> => {
      if ('generate' in maybeWeightedArbitrary) {
        return { arbitrary: maybeWeightedArbitrary, weight: 1 };
      }
      return maybeWeightedArbitrary;
    }
  );
  return FrequencyArbitrary.from(weightedArbs, {}, 'fc.oneof');
}
export { oneof };
