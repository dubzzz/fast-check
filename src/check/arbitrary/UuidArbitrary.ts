import { Arbitrary } from './definition/Arbitrary';
import { integer } from '../../arbitrary/integer';
import { nat } from '../../arbitrary/nat';
import { tuple } from './TupleArbitrary';

/** @internal */
const padEight = (arb: Arbitrary<number>) => arb.map((n) => n.toString(16).padStart(8, '0'));

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
  const padded = padEight(nat(0xffffffff));
  const secondPadded = padEight(integer(0x10000000, 0x5fffffff));
  const thirdPadded = padEight(integer(0x80000000, 0xbfffffff));
  return tuple(padded, secondPadded, thirdPadded, padded).map((t) => {
    return `${t[0]}-${t[1].substring(4)}-${t[1].substring(0, 4)}-${t[2].substring(0, 4)}-${t[2].substring(4)}${t[3]}`;
  });
}

/**
 * For UUID of a given version (in v1 to v5)
 *
 * According to {@link https://tools.ietf.org/html/rfc4122 | RFC 4122}
 *
 * No mixed case, only lower case digits (0-9a-f)
 *
 * @remarks Since 1.17.0
 * @public
 */
export function uuidV(versionNumber: 1 | 2 | 3 | 4 | 5): Arbitrary<string> {
  const padded = padEight(nat(0xffffffff));
  const secondPadded = padEight(nat(0x0fffffff));
  const thirdPadded = padEight(integer(0x80000000, 0xbfffffff));
  return tuple(padded, secondPadded, thirdPadded, padded).map((t) => {
    return `${t[0]}-${t[1].substring(4)}-${versionNumber}${t[1].substring(1, 4)}-${t[2].substring(
      0,
      4
    )}-${t[2].substring(4)}${t[3]}`;
  });
}
