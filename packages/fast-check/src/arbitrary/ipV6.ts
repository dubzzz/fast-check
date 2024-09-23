import { array } from './array';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { oneof } from './oneof';
import { string } from './string';
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
import { integer } from './integer';

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

const items = '0123456789abcdef';
/** @internal */
function hexa(): Arbitrary<string> {
  return integer({ min: 0, max: 15 }).map(
    (n) => items[n],
    (c) => {
      if (typeof c !== 'string') {
        throw new Error('Not a string');
      }
      const index = items.indexOf(c);
      if (index === -1) {
        throw new Error('Unknown "char"');
      }
      return index;
    },
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

  // Any size-based arbitrary called within the implementation of ipV6 has
  // to be called with size:'max' in order to prevent any behaviour change
  // related to global settings on size. ipV6 is fully independent of size
  const h16Arb = string({ unit: hexa(), minLength: 1, maxLength: 4, size: 'max' });
  const ls32Arb = oneof(tuple(h16Arb, h16Arb).map(h16sTol32Mapper, h16sTol32Unmapper), ipV4());
  return oneof(
    tuple(array(h16Arb, { minLength: 6, maxLength: 6, size: 'max' }), ls32Arb).map(
      fullySpecifiedMapper,
      fullySpecifiedUnmapper,
    ),
    tuple(array(h16Arb, { minLength: 5, maxLength: 5, size: 'max' }), ls32Arb).map(
      onlyTrailingMapper,
      onlyTrailingUnmapper,
    ),
    tuple(
      array(h16Arb, { minLength: 0, maxLength: 1, size: 'max' }),
      array(h16Arb, { minLength: 4, maxLength: 4, size: 'max' }),
      ls32Arb,
    ).map(multiTrailingMapper, multiTrailingUnmapper),
    tuple(
      array(h16Arb, { minLength: 0, maxLength: 2, size: 'max' }),
      array(h16Arb, { minLength: 3, maxLength: 3, size: 'max' }),
      ls32Arb,
    ).map(multiTrailingMapper, multiTrailingUnmapper),
    tuple(
      array(h16Arb, { minLength: 0, maxLength: 3, size: 'max' }),
      array(h16Arb, { minLength: 2, maxLength: 2, size: 'max' }),
      ls32Arb,
    ).map(multiTrailingMapper, multiTrailingUnmapper),
    tuple(array(h16Arb, { minLength: 0, maxLength: 4, size: 'max' }), h16Arb, ls32Arb).map(
      multiTrailingMapperOne,
      multiTrailingUnmapperOne,
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 5, size: 'max' }), ls32Arb).map(
      singleTrailingMapper,
      singleTrailingUnmapper,
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 6, size: 'max' }), h16Arb).map(
      singleTrailingMapper,
      singleTrailingUnmapper,
    ),
    tuple(array(h16Arb, { minLength: 0, maxLength: 7, size: 'max' })).map(noTrailingMapper, noTrailingUnmapper),
  );
}
