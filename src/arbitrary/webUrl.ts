import { array } from './array';
import { constantFrom } from './constantFrom';
import { constant } from './constant';
import { option } from './option';
import { tuple } from './tuple';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { webQueryParameters } from './webQueryParameters';
import { webFragments } from './webFragments';
import { webAuthority, WebAuthorityConstraints } from './webAuthority';
import { webSegment } from './webSegment';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { partsToUrlMapper, partsToUrlUnmapper } from './_internals/mappers/PartsToUrl';
import { segmentsToPathMapper, segmentsToPathUnmapper } from './_internals/mappers/SegmentsToPath';

/**
 * Constraints to be applied on {@link webUrl}
 * @remarks Since 1.14.0
 * @public
 */
export interface WebUrlConstraints {
  /**
   * Enforce specific schemes, eg.: http, https
   * @remarks Since 1.14.0
   */
  validSchemes?: string[];
  /**
   * Settings for {@link webAuthority}
   * @remarks Since 1.14.0
   */
  authoritySettings?: WebAuthorityConstraints;
  /**
   * Enable query parameters in the generated url
   * @remarks Since 1.14.0
   */
  withQueryParameters?: boolean;
  /**
   * Enable fragments in the generated url
   * @remarks Since 1.14.0
   */
  withFragments?: boolean;
}

/**
 * For web url
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986} and
 * {@link https://url.spec.whatwg.org/ | WHATWG URL Standard}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webUrl(constraints?: WebUrlConstraints): Arbitrary<string> {
  const c = constraints || {};
  const validSchemes = c.validSchemes || ['http', 'https'];
  const schemeArb = constantFrom(...validSchemes);
  const authorityArb = webAuthority(c.authoritySettings);
  const pathArb = convertFromNext(convertToNext(array(webSegment())).map(segmentsToPathMapper, segmentsToPathUnmapper));
  return convertFromNext(
    convertToNext(
      tuple(
        schemeArb,
        authorityArb,
        pathArb,
        c.withQueryParameters === true ? option(webQueryParameters()) : constant(null),
        c.withFragments === true ? option(webFragments()) : constant(null)
      )
    ).map(partsToUrlMapper, partsToUrlUnmapper)
  );
}
