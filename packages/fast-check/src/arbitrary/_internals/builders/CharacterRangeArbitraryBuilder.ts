import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { oneof } from '../../oneof.js';
import { mapToConstant } from '../../mapToConstant.js';
import {
  safeCharCodeAt,
  safeNumberToString,
  encodeURIComponent,
  safeMapGet,
  safeMapSet,
} from '../../../utils/globals.js';
import { string } from '../../string.js';

const SMap = Map;
const safeStringFromCharCode = String.fromCharCode;

/** @internal */
const lowerCaseMapper = { num: 26, build: (v: number) => safeStringFromCharCode(v + 0x61) };

/** @internal */
const upperCaseMapper = { num: 26, build: (v: number) => safeStringFromCharCode(v + 0x41) };

/** @internal */
const numericMapper = { num: 10, build: (v: number) => safeStringFromCharCode(v + 0x30) };

/** @internal */
function percentCharArbMapper(c: string): string {
  const encoded = encodeURIComponent(c);
  return c !== encoded ? encoded : `%${safeNumberToString(safeCharCodeAt(c, 0), 16)}`; // always %xy / no %x or %xyz
}
/** @internal */
function percentCharArbUnmapper(value: unknown): string {
  const decoded = decodeURIComponent(value as string);
  return decoded;
}

/** @internal */
const percentCharArb = () =>
  string({ unit: 'binary', minLength: 1, maxLength: 1 }).map(percentCharArbMapper, percentCharArbUnmapper);

let lowerAlphaArbitrary: Arbitrary<string> | undefined = undefined;

/** @internal */
export function getOrCreateLowerAlphaArbitrary(): Arbitrary<string> {
  if (lowerAlphaArbitrary === undefined) {
    lowerAlphaArbitrary = mapToConstant(lowerCaseMapper);
  }
  return lowerAlphaArbitrary;
}

let lowerAlphaNumericArbitraries: Map<string, Arbitrary<string>> | undefined = undefined;

/** @internal */
export function getOrCreateLowerAlphaNumericArbitrary(others: string): Arbitrary<string> {
  if (lowerAlphaNumericArbitraries === undefined) {
    lowerAlphaNumericArbitraries = new SMap();
  }
  let match = safeMapGet(lowerAlphaNumericArbitraries, others);
  if (match === undefined) {
    match = mapToConstant(lowerCaseMapper, numericMapper, {
      num: others.length,
      build: (v) => others[v],
    });
    safeMapSet(lowerAlphaNumericArbitraries, others, match);
  }
  return match;
}

/** @internal */
function buildAlphaNumericArbitrary(others: string): Arbitrary<string> {
  return mapToConstant(lowerCaseMapper, upperCaseMapper, numericMapper, {
    num: others.length,
    build: (v) => others[v],
  });
}

let alphaNumericPercentArbitraries: Map<string, Arbitrary<string>> | undefined = undefined;

/** @internal */
export function getOrCreateAlphaNumericPercentArbitrary(others: string): Arbitrary<string> {
  if (alphaNumericPercentArbitraries === undefined) {
    alphaNumericPercentArbitraries = new SMap();
  }
  let match = safeMapGet(alphaNumericPercentArbitraries, others);
  if (match === undefined) {
    match = oneof(
      { weight: 10, arbitrary: buildAlphaNumericArbitrary(others) },
      { weight: 1, arbitrary: percentCharArb() },
    );
    safeMapSet(alphaNumericPercentArbitraries, others, match);
  }
  return match;
}
