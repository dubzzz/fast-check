import { array } from './array';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { oneof } from './oneof';
import { hexaString } from './hexaString';
import { tuple } from './tuple';
import { ipV4 } from './ipV4';

/**
 * For valid IP v6
 *
 * Following {@link https://tools.ietf.org/html/rfc3986#section-3.2.2 | RFC 3986}
 *
 * @remarks Since 1.14.0
 * @public
 */
export function ipV6(): Arbitrary<string> {
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
  const h16Arb = hexaString({ minLength: 1, maxLength: 4 });
  const ls32Arb = oneof(
    tuple(h16Arb, h16Arb).map(([a, b]) => `${a}:${b}`),
    ipV4()
  );
  return oneof(
    tuple(array(h16Arb, { minLength: 6, maxLength: 6 }), ls32Arb).map(([eh, l]) => `${eh.join(':')}:${l}`),
    tuple(array(h16Arb, { minLength: 5, maxLength: 5 }), ls32Arb).map(([eh, l]) => `::${eh.join(':')}:${l}`),
    tuple(array(h16Arb, { minLength: 0, maxLength: 1 }), array(h16Arb, { minLength: 4, maxLength: 4 }), ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh.join(':')}:${l}`
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 2 }), array(h16Arb, { minLength: 3, maxLength: 3 }), ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh.join(':')}:${l}`
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 3 }), array(h16Arb, { minLength: 2, maxLength: 2 }), ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh.join(':')}:${l}`
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 4 }), h16Arb, ls32Arb).map(
      ([bh, eh, l]) => `${bh.join(':')}::${eh}:${l}`
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 5 }), ls32Arb).map(([bh, l]) => `${bh.join(':')}::${l}`),
    tuple(array(h16Arb, { minLength: 0, maxLength: 6 }), h16Arb).map(([bh, eh]) => `${bh.join(':')}::${eh}`),
    tuple(array(h16Arb, { minLength: 0, maxLength: 7 })).map(([bh]) => `${bh.join(':')}::`)
  );
}
