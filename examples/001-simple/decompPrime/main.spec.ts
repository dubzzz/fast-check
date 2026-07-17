import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { decompPrime } from './src/decompPrime.js';

// Above this number a*b can be over 2**31-1
const MAX_INPUT = 65536;

describe('decompPrime', () => {
  it('should produce factors whose product equals the input', async () => {
    await fc.assert(
      fc.asyncProperty(fc.nat(MAX_INPUT), (n) => {
        const factors = decompPrime(n);
        const productOfFactors = factors.reduce((a, b) => a * b, 1);
        return productOfFactors === n;
      }),
    );
  });

  it('should produce at least 2 factors for any composite number', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: MAX_INPUT }), fc.integer({ min: 2, max: MAX_INPUT }), (a, b) => {
        const n = a * b;
        const factors = decompPrime(n);
        return factors.length >= 2;
      }),
    );
  });

  it('should satisfy factors(a*b) = factors(a) ++ factors(b)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: MAX_INPUT }), fc.integer({ min: 2, max: MAX_INPUT }), (a, b) => {
        const factorsA = decompPrime(a);
        const factorsB = decompPrime(b);
        const factorsAB = decompPrime(a * b);
        const reorder = (arr: number[]) => [...arr].sort((a, b) => a - b);
        expect(reorder(factorsAB)).toEqual(reorder([...factorsA, ...factorsB]));
      }),
    );
  });
});
