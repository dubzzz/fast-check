import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { bigUintN } from './BigIntArbitrary';
import { Stream } from '../../stream/Stream';

export interface MixedCaseConstraints {
  toggleCase?: (rawChar: string) => string;
}

/** @hidden */
class MixedCaseArbitrary extends Arbitrary<string> {
  constructor(private readonly stringArb: Arbitrary<string>, private readonly toggleCase: (rawChar: string) => string) {
    super();
  }
  // azerty
  // AzertY
  // 100101 <- flags
  // 1011
  // ay
  // Ay
  private computeTogglePositions(chars: string[]): number[] {
    const positions: number[] = [];
    for (let idx = 0; idx !== chars.length; ++idx) {
      if (this.toggleCase(chars[idx]) !== chars[idx]) positions.push(idx);
    }
    return positions;
  }
  private countToggledBits(n: bigint): number {
    let count = 0;
    while (n > BigInt(0)) {
      if (n & BigInt(1)) ++count;
      n >>= BigInt(1);
    }
    return count;
  }
  private wrapper(
    rawCase: Shrinkable<string>,
    chars: string[],
    togglePositions: number[],
    flags: bigint
  ): Shrinkable<string> {
    const newChars = chars.slice();
    for (let idx = 0, mask = BigInt(1); idx !== togglePositions.length; ++idx, mask <<= BigInt(1)) {
      if (flags & mask) newChars[togglePositions[idx]] = this.toggleCase(newChars[togglePositions[idx]]);
    }
    return new Shrinkable(newChars.join(''), () => this.shrinkImpl(rawCase, chars, togglePositions, flags));
  }
  private shrinkImpl(
    rawCase: Shrinkable<string>,
    chars: string[],
    togglePositions: number[],
    flags: bigint
  ): Stream<Shrinkable<string>> {
    return rawCase
      .shrink()
      .map(s => {
        const nChars = [...s.value_];
        const nTogglePositions = this.computeTogglePositions(nChars);

        // whenever possible we want to preserve the same number of toggled positions
        // whenever possible we want to keep them at the same place
        // flags: 1000101 -> 10011 or 11001 (second choice for the moment)
        const allowedMask = (BigInt(1) << BigInt(nTogglePositions.length)) - BigInt(1);
        const preservedFlags = flags & allowedMask;
        let numMissingFlags = this.countToggledBits(flags - preservedFlags);
        let nFlags = preservedFlags;
        for (let mask = BigInt(1); mask < allowedMask && numMissingFlags !== 0; mask <<= BigInt(1)) {
          if (!(nFlags & mask)) {
            nFlags |= mask;
            --numMissingFlags;
          }
        }
        return this.wrapper(s, nChars, nTogglePositions, nFlags);
      })
      .join(
        bigUintN(togglePositions.length)
          .shrinkableFor(flags)
          .shrink()
          .map(nFlags => {
            return this.wrapper(rawCase, chars, togglePositions, nFlags.value_);
          })
      );
  }
  generate(mrng: Random): Shrinkable<string> {
    const rawCaseShrinkable = this.stringArb.generate(mrng);

    const chars = [...rawCaseShrinkable.value_]; // split into valid unicode (keeps surrogate pairs)
    const togglePositions = this.computeTogglePositions(chars);

    // flags: true => toggle the char, false => keep it as-is
    const flagsArb = bigUintN(togglePositions.length);
    const flags = flagsArb.generate(mrng).value_;

    const newChars = chars.slice();
    for (let idx = 0, mask = BigInt(1); idx !== togglePositions.length; ++idx, mask <<= BigInt(1)) {
      if (flags & mask) newChars[togglePositions[idx]] = this.toggleCase(newChars[togglePositions[idx]]);
    }
    return this.wrapper(rawCaseShrinkable, chars, togglePositions, flags);
  }
}

/** @hidden */
function defaultToggleCase(rawChar: string) {
  const upper = rawChar.toUpperCase();
  if (upper !== rawChar) return upper;
  return rawChar.toLowerCase();
}

export function mixedCase(stringArb: Arbitrary<string>, constraints?: MixedCaseConstraints): Arbitrary<string> {
  if (typeof BigInt === 'undefined') {
    throw new Error(`mixedCase requires BigInt support`);
  }
  const toggleCase = (constraints && constraints.toggleCase) || defaultToggleCase;
  return new MixedCaseArbitrary(stringArb, toggleCase);
}
