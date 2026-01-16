import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { safeJoin, safeSplit } from '../utils/globals.js';
import { oneof } from './oneof.js';
import { tuple } from './tuple.js';
import { buildStringifiedNatArbitrary } from './_internals/builders/StringifiedNatArbitraryBuilder.js';

/** @internal */
function dotJoinerMapper(data: string[]): string {
  return safeJoin(data, '.');
}

/** @internal */
function dotJoinerUnmapper(value: unknown): string[] {
  return safeSplit(value as string, '.');
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
export function ipV4Extended(): Arbitrary<string> {
  return oneof(
    tuple<string[]>(
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(255),
    ).map(dotJoinerMapper, dotJoinerUnmapper),
    tuple<string[]>(
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(65535),
    ).map(dotJoinerMapper, dotJoinerUnmapper),
    tuple<string[]>(buildStringifiedNatArbitrary(255), buildStringifiedNatArbitrary(16777215)).map(
      dotJoinerMapper,
      dotJoinerUnmapper,
    ),
    buildStringifiedNatArbitrary(4294967295),
  );
}
