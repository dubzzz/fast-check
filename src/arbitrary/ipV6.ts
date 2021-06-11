import { array } from './array';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { oneof } from './oneof';
import { hexaString } from './hexaString';
import { tuple } from './tuple';
import { ipV4 } from './ipV4';
import {
  fullySpecifiedMapper,
  fullySpecifiedUnmapper,
  onlyTrailingMapper,
  onlyTrailingUnmapper,
  multiTrailingMapper,
  multiTrailingUnmapper,
  multiTrailingMapperOne,
  multiTrailingUnmapperOne,
  singleTrailingMapper,
  singleTrailingUnmapper,
  noTrailingMapper,
  noTrailingUnmapper,
} from './_internals/mappers/EntitiesToIPv6';

/** @internal */
function h16sTol32Mapper([a, b]: [string, string]): string {
  return `${a}:${b}`;
}

/** @internal */
function h16sTol32Unmapper(value: unknown): [string, string] {
  if (typeof value !== 'string') throw new Error('Invalid type');
  if (!value.includes(':')) throw new Error('Invalid value');
  return value.split(':', 2) as [string, string];
}

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
    convertFromNext(convertToNext(tuple(h16Arb, h16Arb)).map(h16sTol32Mapper, h16sTol32Unmapper)),
    ipV4()
  );
  return oneof(
    convertFromNext(
      convertToNext(tuple(array(h16Arb, { minLength: 6, maxLength: 6 }), ls32Arb)).map(
        fullySpecifiedMapper,
        fullySpecifiedUnmapper
      )
    ),
    convertFromNext(
      convertToNext(tuple(array(h16Arb, { minLength: 5, maxLength: 5 }), ls32Arb)).map(
        onlyTrailingMapper,
        onlyTrailingUnmapper
      )
    ),
    convertFromNext(
      convertToNext(
        tuple(array(h16Arb, { minLength: 0, maxLength: 1 }), array(h16Arb, { minLength: 4, maxLength: 4 }), ls32Arb)
      ).map(multiTrailingMapper, multiTrailingUnmapper)
    ),
    convertFromNext(
      convertToNext(
        tuple(array(h16Arb, { minLength: 0, maxLength: 2 }), array(h16Arb, { minLength: 3, maxLength: 3 }), ls32Arb)
      ).map(multiTrailingMapper, multiTrailingUnmapper)
    ),
    convertFromNext(
      convertToNext(
        tuple(array(h16Arb, { minLength: 0, maxLength: 3 }), array(h16Arb, { minLength: 2, maxLength: 2 }), ls32Arb)
      ).map(multiTrailingMapper, multiTrailingUnmapper)
    ),
    convertFromNext(
      convertToNext(tuple(array(h16Arb, { minLength: 0, maxLength: 4 }), h16Arb, ls32Arb)).map(
        multiTrailingMapperOne,
        multiTrailingUnmapperOne
      )
    ),
    convertFromNext(
      convertToNext(tuple(array(h16Arb, { minLength: 0, maxLength: 5 }), ls32Arb)).map(
        singleTrailingMapper,
        singleTrailingUnmapper
      )
    ),
    convertFromNext(
      convertToNext(tuple(array(h16Arb, { minLength: 0, maxLength: 6 }), h16Arb)).map(
        singleTrailingMapper,
        singleTrailingUnmapper
      )
    ),
    convertFromNext(
      convertToNext(tuple(array(h16Arb, { minLength: 0, maxLength: 7 }))).map(noTrailingMapper, noTrailingUnmapper)
    )
  );
}
