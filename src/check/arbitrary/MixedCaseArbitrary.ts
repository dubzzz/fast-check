import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { bigUintN } from '../../arbitrary/bigUintN';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';

/**
 * Constraints to be applied on {@link mixedCase}
 * @remarks Since 1.17.0
 * @public
 */
export interface MixedCaseConstraints {
  /**
   * Transform a character to its upper and/or lower case version
   * @remarks Since 1.17.0
   */
  toggleCase?: (rawChar: string) => string;
}

/** @internal */
export function countToggledBits(n: bigint): number {
  let count = 0;
  while (n > BigInt(0)) {
    if (n & BigInt(1)) ++count;
    n >>= BigInt(1);
  }
  return count;
}

/** @internal */
export function computeNextFlags(flags: bigint, nextSize: number): bigint {
  // whenever possible we want to preserve the same number of toggled positions
  // whenever possible we want to keep them at the same place
  // flags: 1000101 -> 10011 or 11001 (second choice for the moment)
  const allowedMask = (BigInt(1) << BigInt(nextSize)) - BigInt(1);
  const preservedFlags = flags & allowedMask;
  let numMissingFlags = countToggledBits(flags - preservedFlags);
  let nFlags = preservedFlags;
  for (let mask = BigInt(1); mask <= allowedMask && numMissingFlags !== 0; mask <<= BigInt(1)) {
    if (!(nFlags & mask)) {
      nFlags |= mask;
      --numMissingFlags;
    }
  }
  return nFlags;
}

/** @internal */
class MixedCaseArbitrary extends Arbitrary<string> {
  constructor(private readonly stringArb: Arbitrary<string>, private readonly toggleCase: (rawChar: string) => string) {
    super();
  }
  private computeTogglePositions(chars: string[]): number[] {
    const positions: number[] = [];
    for (let idx = 0; idx !== chars.length; ++idx) {
      if (this.toggleCase(chars[idx]) !== chars[idx]) positions.push(idx);
    }
    return positions;
  }
  /**
   * Produce a Shrinkable
   * @param rawCase - Shrinkable containing the raw string (without any toggled case)
   * @param chars - Raw string split into an array of code points
   * @param togglePositions - Array referencing all case sensitive indexes in chars
   * @param flags - One flag/bit per entry in togglePositions - 1 means change case of the character
   * @param flagsContext - Context used by bigUintN(togglePositions.length) to optimize shrinker for the value 'flags'
   * @internal
   */
  private wrapper(
    rawCase: Shrinkable<string>,
    chars: string[],
    togglePositions: number[],
    flags: bigint,
    flagsContext: unknown
  ): Shrinkable<string> {
    const newChars = chars.slice();
    for (let idx = 0, mask = BigInt(1); idx !== togglePositions.length; ++idx, mask <<= BigInt(1)) {
      if (flags & mask) newChars[togglePositions[idx]] = this.toggleCase(newChars[togglePositions[idx]]);
    }
    return new Shrinkable(newChars.join(''), () =>
      this.shrinkImpl(rawCase, chars, togglePositions, flags, flagsContext)
    );
  }
  /**
   * Produce a Stream of Shrinkable
   * @param rawCase - Shrinkable containing the raw string (without any toggled case)
   * @param chars - Raw string split into an array of code points
   * @param togglePositions - Array referencing all case sensitive indexes in chars
   * @param flags - One flag/bit per entry in togglePositions - 1 means change case of the character
   * @param flagsContext - Context used by bigUintN(togglePositions.length) to optimize shrinker for the value 'flags'
   * @internal
   */
  private shrinkImpl(
    rawCase: Shrinkable<string>,
    chars: string[],
    togglePositions: number[],
    flags: bigint,
    flagsContext: unknown
  ): Stream<Shrinkable<string>> {
    return rawCase
      .shrink()
      .map((s) => {
        const nChars = [...s.value_];
        const nTogglePositions = this.computeTogglePositions(nChars);
        const nFlags = computeNextFlags(flags, nTogglePositions.length);
        // Potentially new value for nTogglePositions.length, new value for nFlags
        // flagsContext is not applicable anymore
        return this.wrapper(s, nChars, nTogglePositions, nFlags, undefined);
      })
      .join(
        bigUintN(togglePositions.length)
          .contextualShrink(flags, flagsContext)
          .map((contextualValue) => {
            return this.wrapper(
              new Shrinkable(rawCase.value),
              chars,
              togglePositions,
              contextualValue[0],
              contextualValue[1]
            );
          })
      );
  }
  generate(mrng: Random): Shrinkable<string> {
    const rawCaseShrinkable = this.stringArb.generate(mrng);

    const chars = [...rawCaseShrinkable.value_]; // split into valid unicode (keeps surrogate pairs)
    const togglePositions = this.computeTogglePositions(chars);

    const flagsArb = bigUintN(togglePositions.length);
    const flags = flagsArb.generate(mrng).value_; // true => toggle the char, false => keep it as-is

    return this.wrapper(rawCaseShrinkable, chars, togglePositions, flags, undefined);
  }

  withBias(freq: number): Arbitrary<string> {
    return biasWrapper(freq, this, () => new MixedCaseArbitrary(this.stringArb.withBias(freq), this.toggleCase));
  }
}

/** @internal */
function defaultToggleCase(rawChar: string) {
  const upper = rawChar.toUpperCase();
  if (upper !== rawChar) return upper;
  return rawChar.toLowerCase();
}

/**
 * Randomly switch the case of characters generated by `stringArb` (upper/lower)
 *
 * WARNING:
 * Require bigint support.
 * Under-the-hood the arbitrary relies on bigint to compute the flags that should be toggled or not.
 *
 * @param stringArb - Arbitrary able to build string values
 * @param constraints - Constraints to be applied when computing upper/lower case version
 *
 * @remarks Since 1.17.0
 * @public
 */
export function mixedCase(stringArb: Arbitrary<string>, constraints?: MixedCaseConstraints): Arbitrary<string> {
  if (typeof BigInt === 'undefined') {
    throw new Error(`mixedCase requires BigInt support`);
  }
  const toggleCase = (constraints && constraints.toggleCase) || defaultToggleCase;
  return new MixedCaseArbitrary(stringArb, toggleCase);
}
