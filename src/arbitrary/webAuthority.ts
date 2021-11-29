import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildAlphaNumericPercentArbitrary } from './_internals/builders/CharacterRangeArbitraryBuilder';
import { constant } from './constant';
import { domain } from './domain';
import { ipV4 } from './ipV4';
import { ipV4Extended } from './ipV4Extended';
import { ipV6 } from './ipV6';
import { nat } from './nat';
import { oneof } from './oneof';
import { option } from './option';
import { stringOf } from './stringOf';
import { tuple } from './tuple';

/** @internal */
function hostUserInfo(): Arbitrary<string> {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArbitrary(others));
}

/** @internal */
function userHostPortMapper([u, h, p]: [string | null, string, number | null]): string {
  return (u === null ? '' : `${u}@`) + h + (p === null ? '' : `:${p}`);
}
/** @internal */
function userHostPortUnmapper(value: unknown): [string | null, string, number | null] {
  if (typeof value !== 'string') {
    throw new Error('Unsupported');
  }
  const atPosition = value.indexOf('@');
  const user = atPosition !== -1 ? value.substring(0, atPosition) : null;
  const portRegex = /:(\d+)$/;
  const m = portRegex.exec(value);
  const port = m !== null ? Number(m[1]) : null;
  const host =
    m !== null ? value.substring(atPosition + 1, value.length - m[1].length - 1) : value.substring(atPosition + 1);
  return [user, host, port];
}
/** @internal */
function bracketedMapper(s: string): string {
  return `[${s}]`;
}
/** @internal */
function bracketedUnmapper(value: unknown): string {
  if (typeof value !== 'string' || value[0] !== '[' || value[value.length - 1] !== ']') {
    throw new Error('Unsupported');
  }
  return value.substring(1, value.length - 1);
}

/**
 * Constraints to be applied on {@link webAuthority}
 * @remarks Since 1.14.0
 * @public
 */
export interface WebAuthorityConstraints {
  /**
   * Enable IPv4 in host
   * @remarks Since 1.14.0
   */
  withIPv4?: boolean;
  /**
   * Enable IPv6 in host
   * @remarks Since 1.14.0
   */
  withIPv6?: boolean;
  /**
   * Enable extended IPv4 format
   * @remarks Since 1.17.0
   */
  withIPv4Extended?: boolean;
  /**
   * Enable user information prefix
   * @remarks Since 1.14.0
   */
  withUserInfo?: boolean;
  /**
   * Enable port suffix
   * @remarks Since 1.14.0
   */
  withPort?: boolean;
}

/**
 * For web authority
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986} - `authority = [ userinfo "@" ] host [ ":" port ]`
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webAuthority(constraints?: WebAuthorityConstraints): Arbitrary<string> {
  const c = constraints || {};
  const hostnameArbs = [domain()]
    .concat(c.withIPv4 === true ? [ipV4()] : [])
    .concat(c.withIPv6 === true ? [ipV6().map(bracketedMapper, bracketedUnmapper)] : [])
    .concat(c.withIPv4Extended === true ? [ipV4Extended()] : []);
  return tuple(
    c.withUserInfo === true ? option(hostUserInfo()) : constant(null),
    oneof(...hostnameArbs),
    c.withPort === true ? option(nat(65535)) : constant(null)
  ).map(userHostPortMapper, userHostPortUnmapper);
}
