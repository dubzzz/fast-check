import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterInvalidSubdomainLabel } from '../../../../../src/arbitrary/_internals/helpers/InvalidSubdomainLabelFiIter';

describe('filterInvalidSubdomainLabel', () => {
  // Internal function:
  // We are not checking all the requirements of subdomains but just the ones we need to ensure
  // post construction as they cannot be easily enforced except by a filtering logic
  const alphaChar = () => fc.mapToConstant({ num: 26, build: (v) => String.fromCharCode(v + 0x61) });

  it('should accept any subdomain composed of only alphabet characters and with at most 63 characters', () =>
    fc.assert(
      fc.property(fc.string({ unit: alphaChar(), minLength: 1, maxLength: 63 }), (subdomainLabel) => {
        expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(true);
      }),
    ));

  it('should reject any subdomain with strictly more than 63 characters', () =>
    fc.assert(
      fc.property(fc.string({ unit: alphaChar(), minLength: 64 }), (subdomainLabel) => {
        expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(false);
      }),
    ));

  it('should reject any subdomain starting by "xn--"', () =>
    fc.assert(
      fc.property(fc.string({ unit: alphaChar(), maxLength: 63 - 'xn--'.length }), (subdomainLabelEnd) => {
        const subdomainLabel = `xn--${subdomainLabelEnd}`;
        expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(false);
      }),
    ));

  it('should not reject subdomains if they start by a substring of "xn--"', () =>
    fc.assert(
      fc.property(
        fc.string({ unit: alphaChar(), maxLength: 63 - 'xn--'.length }),
        fc.nat('xn--'.length - 1),
        (subdomainLabelEnd, keep) => {
          const subdomainLabel = `${'xn--'.substring(0, keep)}${subdomainLabelEnd}`;
          expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(true);
        },
      ),
    ));
});
