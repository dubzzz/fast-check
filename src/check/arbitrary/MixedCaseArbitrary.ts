import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { bigUintN } from '../../arbitrary/bigUintN';
import { Arbitrary } from './definition/Arbitrary';
import { NextArbitrary } from './definition/NextArbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { NextValue } from './definition/NextValue';
import { makeLazy } from '../../stream/LazyIterableIterator';

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
type MixedCaseArbitraryContext = {
  rawString: string;
  rawStringContext: unknown;
  flags: bigint;
  flagsContext: unknown;
};

/** @internal */
class MixedCaseArbitrary extends NextArbitrary<string> {
  constructor(
    private readonly stringArb: NextArbitrary<string>,
    private readonly toggleCase: (rawChar: string) => string
  ) {
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
   * Apply flags onto chars
   * @param chars - Original string split into characters
   * @param flags - One flag/bit per entry in togglePositions - 1 means change case of the character
   * @param togglePositions - Array referencing all case sensitive indexes in chars
   */
  private applyFlagsOnChars(chars: string[], flags: bigint, togglePositions: number[]) {
    for (let idx = 0, mask = BigInt(1); idx !== togglePositions.length; ++idx, mask <<= BigInt(1)) {
      if (flags & mask) chars[togglePositions[idx]] = this.toggleCase(chars[togglePositions[idx]]);
    }
    return chars;
  }

  /**
   * Create a proper context
   * @param rawStringNextValue
   * @param flagsNextValue
   */
  private buildContextFor(
    rawStringNextValue: NextValue<string>,
    flagsNextValue: NextValue<bigint>
  ): MixedCaseArbitraryContext {
    return {
      rawString: rawStringNextValue.value,
      rawStringContext: rawStringNextValue.context,
      flags: flagsNextValue.value,
      flagsContext: flagsNextValue.context,
    };
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<string> {
    const rawStringNextValue = this.stringArb.generate(mrng, biasFactor);

    const chars = [...rawStringNextValue.value]; // split into valid unicode (keeps surrogate pairs)
    const togglePositions = this.computeTogglePositions(chars);

    const flagsArb = convertToNext(bigUintN(togglePositions.length));
    const flagsNextValue = flagsArb.generate(mrng, undefined); // true => toggle the char, false => keep it as-is

    this.applyFlagsOnChars(chars, flagsNextValue.value, togglePositions);
    return new NextValue(chars.join(''), this.buildContextFor(rawStringNextValue, flagsNextValue));
  }

  canGenerate(value: unknown): value is string {
    // Not implemented yet
    return false;
  }

  shrink(_value: string, context?: unknown): Stream<NextValue<string>> {
    if (context === undefined) {
      // Not implemented yet
      return Stream.nil();
    }

    const contextSafe = context as MixedCaseArbitraryContext;
    const rawString = contextSafe.rawString;
    const flags = contextSafe.flags;
    return this.stringArb
      .shrink(rawString, contextSafe.rawStringContext)
      .map((nRawStringNextValue) => {
        const nChars = [...nRawStringNextValue.value];
        const nTogglePositions = this.computeTogglePositions(nChars);
        const nFlags = computeNextFlags(flags, nTogglePositions.length);
        // Potentially new value for nTogglePositions.length, new value for nFlags
        // so flagsContext is not applicable anymore
        this.applyFlagsOnChars(nChars, nFlags, nTogglePositions);
        return new NextValue(nChars.join(''), this.buildContextFor(nRawStringNextValue, new NextValue(nFlags)));
      })
      .join(
        makeLazy(() => {
          const chars = [...rawString];
          const togglePositions = this.computeTogglePositions(chars);
          return convertToNext(bigUintN(togglePositions.length))
            .shrink(flags, contextSafe.flagsContext)
            .map((nFlagsNextValue) => {
              const nChars = chars.slice(); // cloning chars
              this.applyFlagsOnChars(nChars, nFlagsNextValue.value, togglePositions);
              return new NextValue(nChars.join(''), this.buildContextFor(new NextValue(rawString), nFlagsNextValue));
            });
        })
      );
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
  return convertFromNext(new MixedCaseArbitrary(convertToNext(stringArb), toggleCase));
}
