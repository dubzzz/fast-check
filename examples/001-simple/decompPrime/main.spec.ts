import fc from 'fast-check';
import { decompPrime } from './src/decompPrime';

// Above this number a*b can be over 2**31-1
const MAX_INPUT = 65536;

describe('decompPrime', () => {
  it('should produce an array such that the product equals the input', () => {
    fc.assert(
      fc.property(fc.nat(MAX_INPUT), (n) => {
        const factors = decompPrime(n);
        const productOfFactors = factors.reduce((a, b) => a * b, 1);
        return productOfFactors === n;
      })
    );
  });

  it('should be able to decompose a product of two numbers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: MAX_INPUT }), fc.integer({ min: 2, max: MAX_INPUT }), (a, b) => {
        const n = a * b;
        const factors = decompPrime(n);
        return factors.length >= 2;
      })
    );
  });

  it('should compute the same factors as to the concatenation of the one of a and b for a times b', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: MAX_INPUT }), fc.integer({ min: 2, max: MAX_INPUT }), (a, b) => {
        const factorsA = decompPrime(a);
        const factorsB = decompPrime(b);
        const factorsAB = decompPrime(a * b);
        const reorder = (arr: number[]) => [...arr].sort((a, b) => a - b);
        expect(reorder(factorsAB)).toEqual(reorder([...factorsA, ...factorsB]));
      })
    );
  });
});
