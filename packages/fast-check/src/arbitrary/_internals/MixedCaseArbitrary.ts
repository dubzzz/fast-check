import type { Random } from '../../random/generator/Random';
import type { Stream } from '../../stream/Stream';
import { bigInt } from '../bigInt';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { makeLazy } from '../../stream/LazyIterableIterator';
import {
  applyFlagsOnChars,
  computeFlagsFromChars,
  computeNextFlags,
  computeTogglePositions,
} from './helpers/ToggleFlags';
import { safeJoin, safeSlice } from '../../utils/globals';
import { BigInt } from '../../utils/globals';

/** @internal */
type MixedCaseArbitraryContext = {
  rawString: string;
  rawStringContext: unknown;
  flags: bigint;
  flagsContext: unknown;
};

/** @internal */
export class MixedCaseArbitrary extends Arbitrary<string> {
  constructor(
    private readonly stringArb: Arbitrary<string>,
    private readonly toggleCase: (rawChar: string) => string,
    private readonly untoggleAll: ((toggledString: string) => string) | undefined,
  ) {
    super();
  }

  /**
   * Create a proper context
   * @param rawStringValue
   * @param flagsValue
   */
  private buildContextFor(rawStringValue: Value<string>, flagsValue: Value<bigint>): MixedCaseArbitraryContext {
    return {
      rawString: rawStringValue.value,
      rawStringContext: rawStringValue.context,
      flags: flagsValue.value,
      flagsContext: flagsValue.context,
    };
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<string> {
    const rawStringValue = this.stringArb.generate(mrng, biasFactor);

    const chars = [...rawStringValue.value]; // split into valid unicode (keeps surrogate pairs)
    const togglePositions = computeTogglePositions(chars, this.toggleCase);

    const flagsArb = bigInt(BigInt(0), (BigInt(1) << BigInt(togglePositions.length)) - BigInt(1));
    const flagsValue = flagsArb.generate(mrng, undefined); // true => toggle the char, false => keep it as-is

    applyFlagsOnChars(chars, flagsValue.value, togglePositions, this.toggleCase);
    return new Value(safeJoin(chars, ''), this.buildContextFor(rawStringValue, flagsValue));
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

  shrink(value: string, context?: unknown): Stream<Value<string>> {
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
      .map((nRawStringValue) => {
        const nChars = [...nRawStringValue.value];
        const nTogglePositions = computeTogglePositions(nChars, this.toggleCase);
        const nFlags = computeNextFlags(flags, nTogglePositions.length);
        // Potentially new value for nTogglePositions.length, new value for nFlags
        // so flagsContext is not applicable anymore
        applyFlagsOnChars(nChars, nFlags, nTogglePositions, this.toggleCase);
        // Remark: Value nFlags can be attached to a context equal to undefined
        // as `canShrinkWithoutContext(nFlags) === true` for the bigint arbitrary
        return new Value(safeJoin(nChars, ''), this.buildContextFor(nRawStringValue, new Value(nFlags, undefined)));
      })
      .join(
        makeLazy(() => {
          const chars = [...rawString];
          const togglePositions = computeTogglePositions(chars, this.toggleCase);
          return bigInt(BigInt(0), (BigInt(1) << BigInt(togglePositions.length)) - BigInt(1))
            .shrink(flags, contextSafe.flagsContext)
            .map((nFlagsValue) => {
              const nChars = safeSlice(chars); // cloning chars
              applyFlagsOnChars(nChars, nFlagsValue.value, togglePositions, this.toggleCase);
              return new Value(
                safeJoin(nChars, ''),
                this.buildContextFor(new Value(rawString, contextSafe.rawStringContext), nFlagsValue),
              );
            });
        }),
      );
  }
}
