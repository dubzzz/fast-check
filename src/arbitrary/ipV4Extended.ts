import { constantFrom } from './constantFrom';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { nat } from './nat';
import { oneof } from './oneof';
import { tuple } from './tuple';

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
export function ipV4Extended(): Arbitrary<string> {
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
