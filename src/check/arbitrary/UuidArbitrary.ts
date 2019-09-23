import { StringPadStart } from '../../utils/polyfills';
import { Arbitrary } from './definition/Arbitrary';
import { integer, nat } from './IntegerArbitrary';
import { tuple } from './TupleArbitrary';

/** @hidden */
const padEight = (arb: Arbitrary<number>) => arb.map(n => StringPadStart(n.toString(16), 8, '0'));

/**
 * For UUID from v1 to v5
 *
 * According to RFC 4122 - https://tools.ietf.org/html/rfc4122
 *
 * No mixed case, only lower case digits (0-9a-f)
 */
export function uuid() {
  // According to RFC 4122: Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively
  // ie.: ????????-????-X???-Y???-????????????
  //      with X in 1, 2, 3, 4, 5
  //      with Y in 8, 9, A, B
  const padded = padEight(nat(0xffffffff));
  const secondPadded = padEight(integer(0x10000000, 0x5fffffff));
  const thirdPadded = padEight(integer(0x80000000, 0xbfffffff));
  return tuple(padded, secondPadded, thirdPadded, padded).map(t => {
    return `${t[0]}-${t[1].substring(4)}-${t[1].substring(0, 4)}-${t[2].substring(0, 4)}-${t[2].substring(4)}${t[3]}`;
  });
}
