import { fullUnicode } from '../CharacterArbitrary';
import { frequency } from '../FrequencyArbitrary';
import { mapToConstant } from '../MapToConstantArbitrary';

/** @hidden */
const lowerCaseMapper = { num: 26, build: (v: number) => String.fromCharCode(v + 0x61) };

/** @hidden */
const upperCaseMapper = { num: 26, build: (v: number) => String.fromCharCode(v + 0x41) };

/** @hidden */
const numericMapper = { num: 10, build: (v: number) => String.fromCharCode(v + 0x30) };

/** @hidden */
const percentCharArb = fullUnicode().map(c => {
  const encoded = encodeURIComponent(c);
  return c !== encoded ? encoded : `%${c.charCodeAt(0).toString(16)}`; // always %xy / no %x or %xyz
});

/** @hidden */
export const buildLowerAlphaArb = (others: string[]) =>
  mapToConstant(lowerCaseMapper, { num: others.length, build: v => others[v] });

/** @hidden */
export const buildLowerAlphaNumericArb = (others: string[]) =>
  mapToConstant(lowerCaseMapper, numericMapper, { num: others.length, build: v => others[v] });

/** @hidden */
export const buildAlphaNumericArb = (others: string[]) =>
  mapToConstant(lowerCaseMapper, upperCaseMapper, numericMapper, { num: others.length, build: v => others[v] });

/** @hidden */
export const buildAlphaNumericPercentArb = (others: string[]) =>
  frequency(
    {
      weight: 10,
      arbitrary: buildAlphaNumericArb(others)
    },
    {
      weight: 1,
      arbitrary: percentCharArb
    }
  );
