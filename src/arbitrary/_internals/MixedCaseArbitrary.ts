import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { bigUintN } from '../bigUintN';
import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { convertToNext } from '../../check/arbitrary/definition/Converters';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { makeLazy } from '../../stream/LazyIterableIterator';
import {
  applyFlagsOnChars,
  computeFlagsFromChars,
  computeNextFlags,
  computeTogglePositions,
} from './helpers/ToggleFlags';

/** @internal */
type MixedCaseArbitraryContext = {
  rawString: string;
  rawStringContext: unknown;
  flags: bigint;
  flagsContext: unknown;
};

/** @internal */
export class MixedCaseArbitrary extends NextArbitrary<string> {
  constructor(
    private readonly stringArb: NextArbitrary<string>,
    private readonly toggleCase: (rawChar: string) => string,
    private readonly untoggleAll: ((toggledString: string) => string) | undefined
  ) {
    super();
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
    const togglePositions = computeTogglePositions(chars, this.toggleCase);

    const flagsArb = convertToNext(bigUintN(togglePositions.length));
    const flagsNextValue = flagsArb.generate(mrng, undefined); // true => toggle the char, false => keep it as-is

    applyFlagsOnChars(chars, flagsNextValue.value, togglePositions, this.toggleCase);
    return new NextValue(chars.join(''), this.buildContextFor(rawStringNextValue, flagsNextValue));
  }

  canShrinkWithoutContext(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }
    return this.untoggleAll !== undefined
      ? this.stringArb.canShrinkWithoutContext(this.untoggleAll(value))
      : // If nothing was toggled or if the underlying generator can still shrink it, we consider it shrinkable
        this.stringArb.canShrinkWithoutContext(value);
  }

  shrink(value: string, context?: unknown): Stream<NextValue<string>> {
    let contextSafe: MixedCaseArbitraryContext;
    if (context !== undefined) {
      contextSafe = context as MixedCaseArbitraryContext;
    } else {
      // As user should have called canShrinkWithoutContext first;
      // We know that the untoggled string can be shrunk without any context
      if (this.untoggleAll !== undefined) {
        const untoggledValue = this.untoggleAll(value);
        const valueChars = [...value];
        const untoggledValueChars = [...untoggledValue];
        const togglePositions = computeTogglePositions(untoggledValueChars, this.toggleCase);
        contextSafe = {
          rawString: untoggledValue,
          rawStringContext: undefined,
          flags: computeFlagsFromChars(untoggledValueChars, valueChars, togglePositions),
          flagsContext: undefined,
        };
      } else {
        contextSafe = {
          rawString: value,
          rawStringContext: undefined,
          flags: BigInt(0),
          flagsContext: undefined,
        };
      }
    }
    const rawString = contextSafe.rawString;
    const flags = contextSafe.flags;
    return this.stringArb
      .shrink(rawString, contextSafe.rawStringContext)
      .map((nRawStringNextValue) => {
        const nChars = [...nRawStringNextValue.value];
        const nTogglePositions = computeTogglePositions(nChars, this.toggleCase);
        const nFlags = computeNextFlags(flags, nTogglePositions.length);
        // Potentially new value for nTogglePositions.length, new value for nFlags
        // so flagsContext is not applicable anymore
        applyFlagsOnChars(nChars, nFlags, nTogglePositions, this.toggleCase);
        // Remark: Value nFlags can be attached to a context equal to undefined
        // as `canShrinkWithoutContext(nFlags) === true` for the bigint arbitrary
        return new NextValue(
          nChars.join(''),
          this.buildContextFor(nRawStringNextValue, new NextValue(nFlags, undefined))
        );
      })
      .join(
        makeLazy(() => {
          const chars = [...rawString];
          const togglePositions = computeTogglePositions(chars, this.toggleCase);
          return convertToNext(bigUintN(togglePositions.length))
            .shrink(flags, contextSafe.flagsContext)
            .map((nFlagsNextValue) => {
              const nChars = chars.slice(); // cloning chars
              applyFlagsOnChars(nChars, nFlagsNextValue.value, togglePositions, this.toggleCase);
              return new NextValue(
                nChars.join(''),
                this.buildContextFor(new NextValue(rawString, contextSafe.rawStringContext), nFlagsNextValue)
              );
            });
        })
      );
  }
}
