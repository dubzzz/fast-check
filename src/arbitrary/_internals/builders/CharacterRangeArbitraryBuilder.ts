import { fullUnicode } from '../../fullUnicode';
import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { frequency } from '../../frequency';
import { mapToConstant } from '../../mapToConstant';

/** @internal */
const lowerCaseMapper = { num: 26, build: (v: number) => String.fromCharCode(v + 0x61) };

/** @internal */
const upperCaseMapper = { num: 26, build: (v: number) => String.fromCharCode(v + 0x41) };

/** @internal */
const numericMapper = { num: 10, build: (v: number) => String.fromCharCode(v + 0x30) };

/** @internal */
function percentCharArbMapper(c: string): string {
  const encoded = encodeURIComponent(c);
  return c !== encoded ? encoded : `%${c.charCodeAt(0).toString(16)}`; // always %xy / no %x or %xyz
}
/** @internal */
function percentCharArbUnmapper(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Unsupported');
  }
  const decoded = decodeURIComponent(value);
  return decoded;
}

/** @internal */
const percentCharArb = fullUnicode().map(percentCharArbMapper, percentCharArbUnmapper);

/** @internal */
export const buildLowerAlphaArbitrary = (others: string[]): Arbitrary<string> =>
  mapToConstant(lowerCaseMapper, { num: others.length, build: (v) => others[v] });

/** @internal */
export const buildLowerAlphaNumericArbitrary = (others: string[]): Arbitrary<string> =>
  mapToConstant(lowerCaseMapper, numericMapper, { num: others.length, build: (v) => others[v] });

/** @internal */
export const buildAlphaNumericArbitrary = (others: string[]): Arbitrary<string> =>
  mapToConstant(lowerCaseMapper, upperCaseMapper, numericMapper, { num: others.length, build: (v) => others[v] });

/** @internal */
export const buildAlphaNumericPercentArbitrary = (others: string[]): Arbitrary<string> =>
  frequency({ weight: 10, arbitrary: buildAlphaNumericArbitrary(others) }, { weight: 1, arbitrary: percentCharArb });
