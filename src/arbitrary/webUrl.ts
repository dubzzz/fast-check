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

/** @internal */
function segmentsToPathMapper(segments: string[]): string {
  return segments.map((v) => `/${v}`).join('');
}
/** @internal */
function segmentsToPathUnmapper(value: unknown): string[] {
  if (typeof value !== 'string' || value[0] !== '/') {
    throw new Error('Incompatible value received');
  }
  return value.split('/').splice(1);
}
/** @internal */
function partsToUrlMapper(data: [string, string, string, string | null, string | null]): string {
  const [scheme, authority, path] = data;
  const query = data[3] === null ? '' : `?${data[3]}`;
  const fragments = data[4] === null ? '' : `#${data[4]}`;
  return `${scheme}://${authority}${path}${query}${fragments}`;
}
/** @internal More details on RFC 3986, https://www.ietf.org/rfc/rfc3986.txt */
const UrlSplitRegex =
  /^([A-Za-Z0-9+.-]+):\/\/([^/]*)(.*)(\?[A-Za-z0-9\-._~!$&'()*+,;=:@/?%]*)?(#[A-Za-z0-9\-._~!$&'()*+,;=:@/?%]*)?$/;

/** @internal */
function partsToUrlUnmapper(value: unknown): [string, string, string, string | null, string | null] {
  if (typeof value !== 'string') {
    throw new Error('Incompatible value received: type');
  }
  const m = UrlSplitRegex.exec(value);
  if (m === null) {
    throw new Error('Incompatible value received');
  }
  const scheme = m[1];
  const authority = m[2];
  const path = m[3];
  const query: string | undefined = m[4];
  const fragments: string | undefined = m[5];
  return [
    scheme,
    authority,
    path,
    query !== undefined ? query.substring(1) : null,
    fragments !== undefined ? fragments.substring(1) : null,
  ];
}

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
