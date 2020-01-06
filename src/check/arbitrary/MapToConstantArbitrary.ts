import { Arbitrary } from './definition/Arbitrary';
import { nat } from './IntegerArbitrary';

/** @internal */
function computeNumChoices<T>(options: { num: number; build: (idInGroup: number) => T }[]): number {
  if (options.length === 0) throw new Error(`fc.mapToConstant expects at least one option`);
  let numChoices = 0;
  for (let idx = 0; idx !== options.length; ++idx) {
    if (options[idx].num < 0)
      throw new Error(`fc.mapToConstant expects all options to have a number of entries greater or equal to zero`);
    numChoices += options[idx].num;
  }
  if (numChoices === 0) throw new Error(`fc.mapToConstant expects at least one choice among options`);
  return numChoices;
}

/**
 * Generate non-contiguous ranges of values
 * by mapping integer values to constant
 *
 * @param options Builders to be called to generate the values
 *
 * @example
 * ```
 * // generate alphanumeric values (a-z0-9)
 * mapToConstant(
 *   { num: 26, build: v => String.fromCharCode(v + 0x61) },
 *   { num: 10, build: v => String.fromCharCode(v + 0x30) },
 * )
 * ```
 */
export function mapToConstant<T>(...entries: { num: number; build: (idInGroup: number) => T }[]): Arbitrary<T> {
  const numChoices = computeNumChoices(entries);
  return nat(numChoices - 1).map(choice => {
    let idx = -1;
    let numSkips = 0;
    while (choice >= numSkips) {
      numSkips += entries[++idx].num;
    }
    return entries[idx].build(choice - numSkips + entries[idx].num);
  });
}
