import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { autonomousDecomposableGraphemeRanges, autonomousGraphemeRanges } from './_internals/data/GraphemeRanges';
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
    for (const range of autonomousDecomposableGraphemeRanges) {
      const rawEntry = convertGraphemeRangeToMapToConstantEntry(range);
      autonomousGraphemeEntries.push({
        num: rawEntry.num,
        build: (idInGroup) => rawEntry.build(idInGroup).normalize('NFD'),
      });
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
