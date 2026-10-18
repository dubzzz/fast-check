import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { oneof } from '../../oneof.js';
import { mapToConstant } from '../../mapToConstant.js';
import { string } from '../../string.js';

const lowerCaseMapper = { num: 26, build: (v: number) => String.fromCharCode(v + 0x61) };

const upperCaseMapper = { num: 26, build: (v: number) => String.fromCharCode(v + 0x41) };

const numericMapper = { num: 10, build: (v: number) => String.fromCharCode(v + 0x30) };

function percentCharArbMapper(c: string): string {
  const encoded = encodeURIComponent(c);
  return c !== encoded ? encoded : `%${c.charCodeAt(0).toString(16)}`; // always %xy / no %x or %xyz
}
function percentCharArbUnmapper(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Unsupported');
  }
  const decoded = decodeURIComponent(value);
  return decoded;
}

const percentCharArb = () =>
  string({ unit: 'binary', minLength: 1, maxLength: 1 }).map(percentCharArbMapper, percentCharArbUnmapper);

let lowerAlphaArbitrary: Arbitrary<string> | undefined = undefined;

export function getOrCreateLowerAlphaArbitrary(): Arbitrary<string> {
  if (lowerAlphaArbitrary === undefined) {
    lowerAlphaArbitrary = mapToConstant(lowerCaseMapper);
  }
  return lowerAlphaArbitrary;
}

let lowerAlphaNumericArbitraries: Map<string, Arbitrary<string>> | undefined = undefined;

export function getOrCreateLowerAlphaNumericArbitrary(others: string): Arbitrary<string> {
  if (lowerAlphaNumericArbitraries === undefined) {
    lowerAlphaNumericArbitraries = new Map();
  }
  let match = lowerAlphaNumericArbitraries.get(others);
  if (match === undefined) {
    match = mapToConstant(lowerCaseMapper, numericMapper, {
      num: others.length,
      build: (v) => others[v],
    });
    lowerAlphaNumericArbitraries.set(others, match);
  }
  return match;
}

function buildAlphaNumericArbitrary(others: string): Arbitrary<string> {
  return mapToConstant(lowerCaseMapper, upperCaseMapper, numericMapper, {
    num: others.length,
    build: (v) => others[v],
  });
}

let alphaNumericPercentArbitraries: Map<string, Arbitrary<string>> | undefined = undefined;

export function getOrCreateAlphaNumericPercentArbitrary(others: string): Arbitrary<string> {
  if (alphaNumericPercentArbitraries === undefined) {
    alphaNumericPercentArbitraries = new Map();
  }
  let match = alphaNumericPercentArbitraries.get(others);
  if (match === undefined) {
    match = oneof(
      { weight: 10, arbitrary: buildAlphaNumericArbitrary(others) },
      { weight: 1, arbitrary: percentCharArb() },
    );
    alphaNumericPercentArbitraries.set(others, match);
  }
  return match;
}
