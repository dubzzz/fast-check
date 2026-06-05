import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { safeSplit } from '../utils/globals.js';
import { oneof } from './oneof.js';
import { tuple } from './tuple.js';
import { buildStringifiedNatArbitrary } from './_internals/builders/StringifiedNatArbitraryBuilder.js';

// Fixed-shape, fused joiners over already-stringified parts. They avoid the
// poisoning-safe `safeJoin` wrapper (identity-check + generic
// Array.prototype.join). For string operands, `+` is byte-identical to
// `data.join('.')`. One joiner per tuple arity used below.

/** @internal */
function dotJoinerMapper4(data: string[]): string {
  return data[0] + '.' + data[1] + '.' + data[2] + '.' + data[3];
}

/** @internal */
function dotJoinerMapper3(data: string[]): string {
  return data[0] + '.' + data[1] + '.' + data[2];
}

/** @internal */
function dotJoinerMapper2(data: string[]): string {
  return data[0] + '.' + data[1];
}

/** @internal */
function dotJoinerUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Invalid type');
  }
  return safeSplit(value, '.');
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
    ).map(dotJoinerMapper4, dotJoinerUnmapper),
    tuple<string[]>(
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(255),
      buildStringifiedNatArbitrary(65535),
    ).map(dotJoinerMapper3, dotJoinerUnmapper),
    tuple<string[]>(buildStringifiedNatArbitrary(255), buildStringifiedNatArbitrary(16777215)).map(
      dotJoinerMapper2,
      dotJoinerUnmapper,
    ),
    buildStringifiedNatArbitrary(4294967295),
  );
}
