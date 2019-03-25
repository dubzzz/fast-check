import { array } from './ArrayArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { nat } from './IntegerArbitrary';
import { oneof } from './OneOfArbitrary';
import { hexaString } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * For valid IP v4
 *
 * Following RFC 3986
 * https://tools.ietf.org/html/rfc3986#section-3.2.2
 */
function ipV4(): Arbitrary<string> {
  // IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet
  return tuple(nat(255), nat(255), nat(255), nat(255)).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);
}

/**
 * For valid IP v6
 *
 * Following RFC 3986
 * https://tools.ietf.org/html/rfc3986#section-3.2.2
 */
function ipV6(): Arbitrary<string> {
  // h16 = 1*4HEXDIG
  // ls32 = ( h16 ":" h16 ) / IPv4address
  // IPv6address   =                            6( h16 ":" ) ls32
  //               /                       "::" 5( h16 ":" ) ls32
  //               / [               h16 ] "::" 4( h16 ":" ) ls32
  //               / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
  //               / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
  //               / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
  //               / [ *4( h16 ":" ) h16 ] "::"              ls32
  //               / [ *5( h16 ":" ) h16 ] "::"              h16
  //               / [ *6( h16 ":" ) h16 ] "::"
  const h16Arb = hexaString(1, 4);
  const ls32Arb = oneof(tuple(h16Arb, h16Arb).map(([a, b]) => `${a}:${b}`), ipV4());
  return oneof(
    tuple(array(h16Arb, 6, 6), ls32Arb).map(([eh, l]) => `${eh.join(':')}:${l}`),
    tuple(array(h16Arb, 5, 5), ls32Arb).map(([eh, l]) => `::${eh.join(':')}:${l}`),
    tuple(array(h16Arb, 0, 1), array(h16Arb, 4, 4), ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh.join(':')}:${l}`
    ),
    tuple(array(h16Arb, 0, 2), array(h16Arb, 3, 3), ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh.join(':')}:${l}`
    ),
    tuple(array(h16Arb, 0, 3), array(h16Arb, 2, 2), ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh.join(':')}:${l}`
    ),
    tuple(array(h16Arb, 0, 4), h16Arb, ls32Arb).map(([bh, eh, l]) => `${bh.join(':')}::${eh}:${l}`),
    tuple(array(h16Arb, 0, 5), ls32Arb).map(([bh, l]) => `${bh.join(':')}::${l}`),
    tuple(array(h16Arb, 0, 6), h16Arb).map(([bh, eh]) => `${bh.join(':')}::${eh}`),
    tuple(array(h16Arb, 0, 7)).map(([bh]) => `${bh.join(':')}::`)
  );
}

export { ipV4, ipV6 };
