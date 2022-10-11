import { constantFrom } from './constantFrom';
import { constant } from './constant';
import { option } from './option';
import { tuple } from './tuple';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { webQueryParameters } from './webQueryParameters';
import { webFragments } from './webFragments';
import { webAuthority, WebAuthorityConstraints } from './webAuthority';
import { partsToUrlMapper, partsToUrlUnmapper } from './_internals/mappers/PartsToUrl';
import { relativeSizeToSize, resolveSize, SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { webPath } from './webPath';

const safeObjectAssign = Object.assign;

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
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: Exclude<SizeForArbitrary, 'max'>;
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
  const resolvedSize = resolveSize(c.size);
  const resolvedAuthoritySettingsSize =
    c.authoritySettings !== undefined && c.authoritySettings.size !== undefined
      ? relativeSizeToSize(c.authoritySettings.size, resolvedSize)
      : resolvedSize;
  // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
  const resolvedAuthoritySettings = safeObjectAssign(safeObjectAssign({}, c.authoritySettings), {
    size: resolvedAuthoritySettingsSize,
  });
  const validSchemes = c.validSchemes || ['http', 'https'];
  const schemeArb = constantFrom(...validSchemes);
  const authorityArb = webAuthority(resolvedAuthoritySettings);
  return tuple(
    schemeArb,
    authorityArb,
    webPath({ size: resolvedSize }),
    c.withQueryParameters === true ? option(webQueryParameters({ size: resolvedSize })) : constant(null),
    c.withFragments === true ? option(webFragments({ size: resolvedSize })) : constant(null)
  ).map(partsToUrlMapper, partsToUrlUnmapper);
}
