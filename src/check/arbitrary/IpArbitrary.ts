import { array } from '../../arbitrary/array';
import { constantFrom } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { nat } from '../../arbitrary/nat';
import { oneof } from '../../arbitrary/oneof';
import { hexaString } from './StringArbitrary';
import { tuple } from '../../arbitrary/tuple';

/**
 * For valid IP v4
 *
 * Following {@link https://tools.ietf.org/html/rfc3986#section-3.2.2 | RFC 3986}
 *
 * @remarks Since 1.14.0
 * @public
 */
function ipV4(): Arbitrary<string> {
  // IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet
  return tuple(nat(255), nat(255), nat(255), nat(255)).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);
}

/**
 * For valid IP v4 according to WhatWG
 *
 * Following {@link https://url.spec.whatwg.org/ | WhatWG}, the specification for web-browsers
 *
 * There is no equivalent for IP v6 according to the {@link https://url.spec.whatwg.org/#concept-ipv6-parser | IP v6 parser}
 *
 * @remarks Since 1.17.0
 * @public
 */
function ipV4Extended(): Arbitrary<string> {
  const natRepr = (maxValue: number) =>
    tuple(constantFrom('dec', 'oct', 'hex'), nat(maxValue)).map(([style, v]) => {
      switch (style) {
        case 'oct':
          return `0${Number(v).toString(8)}`;
        case 'hex':
          return `0x${Number(v).toString(16)}`;
        case 'dec':
        default:
          return `${v}`;
      }
    });
  return oneof(
    tuple(natRepr(255), natRepr(255), natRepr(255), natRepr(255)).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
    tuple(natRepr(255), natRepr(255), natRepr(65535)).map(([a, b, c]) => `${a}.${b}.${c}`),
    tuple(natRepr(255), natRepr(16777215)).map(([a, b]) => `${a}.${b}`),
    natRepr(4294967295)
  );
}

/**
 * For valid IP v6
 *
 * Following {@link https://tools.ietf.org/html/rfc3986#section-3.2.2 | RFC 3986}
 *
 * @remarks Since 1.14.0
 * @public
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

export { ipV4, ipV4Extended, ipV6 };
