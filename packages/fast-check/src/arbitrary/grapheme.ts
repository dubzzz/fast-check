import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { autonomousGraphemeRanges } from './_internals/data/GraphemeRanges';
import {
  convertGraphemeRangeToMapToConstantEntry,
  GraphemeRangeEntry,
} from './_internals/helpers/GraphemeRangesHelpers';
import { mapToConstant } from './mapToConstant';

let autonomousGraphemeEntries: GraphemeRangeEntry[] | undefined = undefined;
function getEntries() {
  if (autonomousGraphemeEntries === undefined) {
    autonomousGraphemeEntries = [];
    for (const range of autonomousGraphemeRanges) {
      autonomousGraphemeEntries.push(convertGraphemeRangeToMapToConstantEntry(range));
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
