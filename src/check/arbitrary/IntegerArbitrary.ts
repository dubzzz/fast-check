import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { ArbitraryWithContextualShrink } from './definition/ArbitraryWithContextualShrink';
import { convertFromNextWithShrunkOnce } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';
import { retrieveBiasRangesForNumeric, integerLogLike } from './helpers/BiasNumeric';
import { shrinkInteger } from './helpers/ShrinkInteger';

/** @internal */
class IntegerArbitrary extends NextArbitrary<number> {
  static MIN_INT: number = 0x80000000 | 0;
  static MAX_INT: number = 0x7fffffff | 0;

  constructor(readonly min: number, readonly max: number) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<number> {
    const range = this.computeGenerateRange(mrng, biasFactor);
    return new NextValue(mrng.nextInt(range.min, range.max), undefined);
  }
  private computeGenerateRange(mrng: Random, biasFactor: number | undefined): { min: number; max: number } {
    if (biasFactor === undefined || mrng.nextInt(1, biasFactor) !== 1) {
      return { min: this.min, max: this.max };
    }
    const ranges = retrieveBiasRangesForNumeric(this.min, this.max, integerLogLike);
    if (ranges.length === 1) {
      return ranges[0];
    }
    const id = mrng.nextInt(-2 * (ranges.length - 1), ranges.length - 2); // 1st range has the highest priority
    return id < 0 ? ranges[0] : ranges[id + 1];
  }

  canGenerate(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && this.min <= value && value <= this.max;
  }

  shrink(current: number, context?: unknown): Stream<NextValue<number>> {
    if (current === 0) {
      return Stream.nil();
    }
    if (!IntegerArbitrary.isValidContext(current, context)) {
      // No context:
      //   Take default target and shrink towards it
      //   Try the target on first try
      const target = this.defaultTarget();
      return shrinkInteger(current, target, true);
    }
    if (this.isLastChanceTry(current, context)) {
      // Last chance try...
      // context is set to undefined, so that shrink will restart
      // without any assumptions in case our try find yet another bug
      return Stream.of(new NextValue(context, undefined));
    }
    // Normal shrink process
    return shrinkInteger(current, context, false);
  }

  defaultTarget(): number {
    // min <= 0 && max >= 0   => shrink towards zero
    if (this.min <= 0 && this.max >= 0) {
      return 0;
    }
    // min < 0                => shrink towards max (closer to zero)
    // otherwise              => shrink towards min (closer to zero)
    return this.min < 0 ? this.max : this.min;
  }

  private isLastChanceTry(current: number, context: number): boolean {
    // If true...
    // We already reached what we thought to be the minimal failing value.
    // But in-between other values may have shrunk (values coming from other arbitraries).
    // In order to check if they impacted us, we just try to move very close to our current value.
    // It is not ideal but it can help restart a shrinking process that stopped too early.
    if (current > 0) return current === context + 1 && current > this.min;
    if (current < 0) return current === context - 1 && current < this.max;
    return false;
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
}

/**
 * Constraints to be applied on {@link integer}
 * @remarks Since 2.6.0
 * @public
 */
export interface IntegerConstraints {
  /**
   * Lower bound for the generated integers (included)
   * @defaultValue -0x80000000
   * @remarks Since 2.6.0
   */
  min?: number;
  /**
   * Upper bound for the generated integers (included)
   * @defaultValue 0x7fffffff
   * @remarks Since 2.6.0
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
 * @remarks Since 0.0.1
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
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function integer(max: number): ArbitraryWithContextualShrink<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param min - Lower bound for the generated integers (eg.: 0, Number.MIN_SAFE_INTEGER)
 * @param max - Upper bound for the generated integers (eg.: 2147483647, Number.MAX_SAFE_INTEGER)
 *
 * @remarks You may prefer to use `fc.integer({min, max})` instead.
 * @remarks Since 0.0.1
 * @public
 */
function integer(min: number, max: number): ArbitraryWithContextualShrink<number>;
/**
 * For integers between min (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
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
  const arb = new IntegerArbitrary(constraints.min, constraints.max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}

/**
 * For integers between Number.MIN_SAFE_INTEGER (included) and Number.MAX_SAFE_INTEGER (included)
 * @remarks Since 1.11.0
 * @public
 */
function maxSafeInteger(): ArbitraryWithContextualShrink<number> {
  return integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
}

/**
 * Constraints to be applied on {@link nat}
 * @remarks Since 2.6.0
 * @public
 */
export interface NatConstraints {
  /**
   * Upper bound for the generated postive integers (included)
   * @defaultValue 0x7fffffff
   * @remarks Since 2.6.0
   */
  max?: number;
}

/**
 * For positive integers between 0 (included) and 2147483647 (included)
 * @remarks Since 0.0.1
 * @public
 */
function nat(): ArbitraryWithContextualShrink<number>;
/**
 * For positive integers between 0 (included) and max (included)
 *
 * @param max - Upper bound for the generated integers
 *
 * @remarks You may prefer to use `fc.nat({max})` instead.
 * @remarks Since 0.0.1
 * @public
 */
function nat(max: number): ArbitraryWithContextualShrink<number>;
/**
 * For positive integers between 0 (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.6.0
 * @public
 */
function nat(constraints: NatConstraints): ArbitraryWithContextualShrink<number>;
function nat(arg?: number | NatConstraints): ArbitraryWithContextualShrink<number> {
  const max = typeof arg === 'number' ? arg : arg && arg.max !== undefined ? arg.max : IntegerArbitrary.MAX_INT;
  if (max < 0) {
    throw new Error('fc.nat value should be greater than or equal to 0');
  }
  const arb = new IntegerArbitrary(0, max);
  return convertFromNextWithShrunkOnce(arb, arb.defaultTarget());
}

/**
 * For positive integers between 0 (included) and Number.MAX_SAFE_INTEGER (included)
 * @remarks Since 1.11.0
 * @public
 */
function maxSafeNat(): ArbitraryWithContextualShrink<number> {
  return nat(Number.MAX_SAFE_INTEGER);
}

export { integer, nat, maxSafeInteger, maxSafeNat };
