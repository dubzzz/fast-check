import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { autonomousGraphemeRanges } from './_internals/data/StringRanges';
import { convertStringRangeToMapToConstantEntry, StringRangeEntry } from './_internals/helpers/StringRangesHelpers';
import { mapToConstant } from './mapToConstant';

let autonomousGraphemeEntries: StringRangeEntry[] | undefined = undefined;
function getEntries() {
  if (autonomousGraphemeEntries === undefined) {
    autonomousGraphemeEntries = [];
    for (const range of autonomousGraphemeRanges) {
      autonomousGraphemeEntries.push(convertStringRangeToMapToConstantEntry(range));
    }
  }
  return autonomousGraphemeEntries;
}

/**
 * XXXX
 *
 * @remarks Since xxx
 * @public
 */
export function grapheme(): Arbitrary<string> {
  return mapToConstant(...getEntries());
}
