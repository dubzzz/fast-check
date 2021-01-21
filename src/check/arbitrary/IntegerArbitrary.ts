import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithContextualShrink } from './definition/ArbitraryWithContextualShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { biasNumeric, integerLogLike } from './helpers/BiasNumeric';
import { shrinkInteger } from './helpers/ShrinkInteger';

/** @internal */
class IntegerArbitrary extends ArbitraryWithContextualShrink<number> {
  static MIN_INT: number = 0x80000000 | 0;
  static MAX_INT: number = 0x7fffffff | 0;

  private biasedIntegerArbitrary: Arbitrary<number> | null = null;
  constructor(readonly min: number, readonly max: number, readonly genMin: number, readonly genMax: number) {
    super();
  }
  private wrapper(value: number, context: unknown): Shrinkable<number> {
    return new Shrinkable(value, () =>
      this.contextualShrink(value, context).map(([v, nextContext]) => this.wrapper(v, nextContext))
    );
  }
  generate(mrng: Random): Shrinkable<number> {
    return this.wrapper(mrng.nextInt(this.genMin, this.genMax), undefined);
  }
  contextualShrink(current: number, context?: unknown): Stream<[number, unknown]> {
    if (current === 0) {
      return Stream.nil();
    }
    if (!IntegerArbitrary.isValidContext(current, context)) {
      const target = this.min <= 0 && this.max >= 0 ? 0 : current < 0 ? this.max : this.min;
      return shrinkInteger(current, target, true);
    }

    // Last chance try...
    // We already reached what we thought to be the minimal failing value.
    // But in-between other values may have shrunk (values coming from other arbitraries).
    // In order to check if they impacted us, we just try to move very close to our current value.
    // It is not ideal but it can help restart a shrinking process that stopped too early.
    if (current === context + 1 && current > this.min && current > 0) {
      return Stream.of([context, undefined]); // undefined resets context in case of failure
    }
    if (current === context - 1 && current < this.max && current < 0) {
      return Stream.of([context, undefined]); // undefined reset context in case of failure
    }

    // Normal shrink process
    return shrinkInteger(current, context, false);
  }
  shrunkOnceContext(): unknown {
    // If we already shrunk once it means that we already at least tried the minimal value
    // requested by our shrinker so we don't need to try it anymore
    if (this.min <= 0 && this.max >= 0) {
      // The target is always zero when zero is included in the range
      return 0;
    }
    // Otherwise the target is the minimal value between min and max in absolute
    return this.min < 0 ? this.max : this.min;
  }
  private static isValidContext(current: number, context?: unknown): context is number {
    // Context contains a value between zero and current that is known to be
    // the closer to zero passing value*.
    // *More precisely: our shrinker will not try something closer to zero
    if (context === undefined) {
      return false;
    }
    if (typeof context !== 'number') {
      throw new Error(`Invalid context type passed to IntegerArbitrary (#1)`);
    }
    if (context !== 0 && Math.sign(current) !== Math.sign(context)) {
      throw new Error(`Invalid context value passed to IntegerArbitrary (#2)`);
    }
    return true;
  }
  private pureBiasedArbitrary(): Arbitrary<number> {
    if (this.biasedIntegerArbitrary != null) {
      return this.biasedIntegerArbitrary;
    }
    this.biasedIntegerArbitrary = biasNumeric<number>(this.min, this.max, IntegerArbitrary, integerLogLike);
    return this.biasedIntegerArbitrary;
  }
  withBias(freq: number): Arbitrary<number> {
    return biasWrapper(freq, this, (originalArbitrary: IntegerArbitrary) => originalArbitrary.pureBiasedArbitrary());
  }
}

/**
 * Constraints to be applied on {@link integer}
 * @public
 */
export interface IntegerConstraints {
  /**
   * Lower bound for the generated integers (included)
   * @defaultValue -0x80000000
   */
  min?: number;
  /**
   * Upper bound for the generated integers (included)
   * @defaultValue 0x7fffffff
   */
  max?: number;
}

/**
 * Build fully set IntegerConstraints from a partial data
 * @internal
 */
function buildCompleteIntegerConstraints(constraints: IntegerConstraints): Required<IntegerConstraints> {
  const min = constraints.min !== undefined ? constraints.min : IntegerArbitrary.MIN_INT;
  const max = constraints.max !== undefined ? constraints.max : IntegerArbitrary.MAX_INT;
  return { min, max };
}

/**
 * Extract constraints from args received by integer
 * @internal
 */
function extractIntegerConstraints(args: [] | [number] | [number, number] | [IntegerConstraints]): IntegerConstraints {
  if (args[0] === undefined) {
    // integer()
    return {};
  } // args.length > 0

  if (args[1] === undefined) {
    const sargs = args as typeof args & [unknown]; // exactly 1 arg specified
    if (typeof sargs[0] === 'number') return { max: sargs[0] }; // integer(max)
    return sargs[0]; // integer(constraints)
  } // args.length > 1

  const sargs = args as typeof args & [unknown, unknown];
  return { min: sargs[0], max: sargs[1] }; // integer(min, max)
}

/**
 * For integers between -2147483648 (included) and 2147483647 (included)
 * @public
 */
function integer(): ArbitraryWithContextualShrink<number>;
/**
 * For integers between -2147483648 (included) and max (included)
 *
 * @param max - Upper bound for the generated integers (eg.: 2147483647, Number.MAX_SAFE_INTEGER)
 *
 * @deprecated
 * Superceded by `fc.integer({max})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function integer(max: number): ArbitraryWithContextualShrink<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param min - Lower bound for the generated integers (eg.: 0, Number.MIN_SAFE_INTEGER)
 * @param max - Upper bound for the generated integers (eg.: 2147483647, Number.MAX_SAFE_INTEGER)
 *
 * @remarks
 * You may prefer to use `fc.integer({min, max})` instead.
 *
 * @public
 */
function integer(min: number, max: number): ArbitraryWithContextualShrink<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function integer(constraints: IntegerConstraints): ArbitraryWithContextualShrink<number>;
function integer(
  ...args: [] | [number] | [number, number] | [IntegerConstraints]
): ArbitraryWithContextualShrink<number> {
  const constraints = buildCompleteIntegerConstraints(extractIntegerConstraints(args));
  if (constraints.min > constraints.max) {
    throw new Error('fc.integer maximum value should be equal or greater than the minimum one');
  }
  return new IntegerArbitrary(constraints.min, constraints.max, constraints.min, constraints.max);
}

/**
 * For integers between Number.MIN_SAFE_INTEGER (included) and Number.MAX_SAFE_INTEGER (included)
 * @public
 */
function maxSafeInteger(): ArbitraryWithContextualShrink<number> {
  return integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
}

/**
 * Constraints to be applied on {@link nat}
 * @public
 */
export interface NatConstraints {
  /**
   * Upper bound for the generated postive integers (included)
   * @defaultValue 0x7fffffff
   */
  max?: number;
}

/**
 * For positive integers between 0 (included) and 2147483647 (included)
 * @public
 */
function nat(): ArbitraryWithContextualShrink<number>;
/**
 * For positive integers between 0 (included) and max (included)
 *
 * @param max - Upper bound for the generated integers
 *
 * @remarks
 * You may prefer to use `fc.nat({max})` instead.
 *
 * @public
 */
function nat(max: number): ArbitraryWithContextualShrink<number>;
/**
 * For positive integers between 0 (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function nat(constraints: NatConstraints): ArbitraryWithContextualShrink<number>;
function nat(arg?: number | NatConstraints): ArbitraryWithContextualShrink<number> {
  const max = typeof arg === 'number' ? arg : arg && arg.max !== undefined ? arg.max : IntegerArbitrary.MAX_INT;
  if (max < 0) {
    throw new Error('fc.nat value should be greater than or equal to 0');
  }
  return new IntegerArbitrary(0, max, 0, max);
}

/**
 * For positive integers between 0 (included) and Number.MAX_SAFE_INTEGER (included)
 * @public
 */
function maxSafeNat(): ArbitraryWithContextualShrink<number> {
  return nat(Number.MAX_SAFE_INTEGER);
}

export { integer, nat, maxSafeInteger, maxSafeNat };
