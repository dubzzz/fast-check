import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { tuple } from './tuple';
import { buildPaddedNumberArbitrary } from './_internals/builders/PaddedNumberArbitraryBuilder';
import { paddedEightsToUuidMapper, paddedEightsToUuidUnmapper } from './_internals/mappers/PaddedEightsToUuid';

/**
 * For UUID from v1 to v5
 *
 * According to {@link https://tools.ietf.org/html/rfc4122 | RFC 4122}
 *
 * No mixed case, only lower case digits (0-9a-f)
 *
 * @remarks Since 1.17.0
 * @public
 */
export function uuid(): Arbitrary<string> {
  // According to RFC 4122: Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively
  // ie.: ????????-????-X???-Y???-????????????
  //      with X in 1, 2, 3, 4, 5
  //      with Y in 8, 9, A, B
  const padded = buildPaddedNumberArbitrary(0, 0xffffffff);
  const secondPadded = buildPaddedNumberArbitrary(0x10000000, 0x5fffffff);
  const thirdPadded = buildPaddedNumberArbitrary(0x80000000, 0xbfffffff);
  return convertFromNext(
    convertToNext(tuple(padded, secondPadded, thirdPadded, padded)).map(
      paddedEightsToUuidMapper,
      paddedEightsToUuidUnmapper
    )
  );
}
