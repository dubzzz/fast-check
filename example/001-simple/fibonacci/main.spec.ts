import fc from 'fast-check';
import { fibo } from './src/fibonacci';

// The complexity of the algorithm is O(n)
// As a consequence we limit the value of n to 1000
const MaxN = 1000;

describe('fibonacci', () => {
  it('should be equal to the sum of fibo(n-1) and fibo(n-2)', () => {
    fc.assert(
      fc.property(fc.integer(2, MaxN), (n) => {
        expect(fibo(n)).toBe(fibo(n - 1) + fibo(n - 2));
      })
    );
  });

  // The following properties are listed on the Wikipedia page:
  // https://fr.wikipedia.org/wiki/Suite_de_Fibonacci#Divisibilit%C3%A9_des_nombres_de_Fibonacci

  it('should fulfill fibo(p)*fibo(q+1)+fibo(p-1)*fibo(q) = fibo(p+q)', () => {
    fc.assert(
      fc.property(fc.integer(1, MaxN), fc.integer(0, MaxN), (p, q) => {
        expect(fibo(p + q)).toBe(fibo(p) * fibo(q + 1) + fibo(p - 1) * fibo(q));
      })
    );
  });

  it('should fulfill fibo(2p-1) = fibo²(p-1)+fibo²(p)', () => {
    // Special case of the property above
    fc.assert(
      fc.property(fc.integer(1, MaxN), (p) => {
        expect(fibo(2 * p - 1)).toBe(fibo(p - 1) * fibo(p - 1) + fibo(p) * fibo(p));
      })
    );
  });

  it('should fulfill Catalan identity', () => {
    fc.assert(
      fc.property(fc.integer(0, MaxN), fc.integer(0, MaxN), (a, b) => {
        const [p, q] = a < b ? [b, a] : [a, b];
        const sign = (p - q) % 2 === 0 ? 1n : -1n; // (-1)^(p-q)
        expect(fibo(p) * fibo(p) - fibo(p - q) * fibo(p + q)).toBe(sign * fibo(q) * fibo(q));
      })
    );
  });

  it('should fulfill Cassini identity', () => {
    fc.assert(
      fc.property(fc.integer(1, MaxN), (p) => {
        const sign = p % 2 === 0 ? 1n : -1n; // (-1)^p
        expect(fibo(p + 1) * fibo(p - 1) - fibo(p) * fibo(p)).toBe(sign);
      })
    );
  });

  it('should fibo(nk) divisible by fibo(n)', () => {
    fc.assert(
      fc.property(fc.integer(1, MaxN), fc.integer(0, 100), (n, k) => {
        expect(fibo(n * k) % fibo(n)).toBe(0n);
      })
    );
  });

  it('should fulfill gcd(fibo(a), fibo(b)) = fibo(gcd(a,b))', () => {
    fc.assert(
      fc.property(fc.integer(1, MaxN), fc.integer(1, MaxN), (a, b) => {
        const gcd = <T extends bigint | number>(a: T, b: T, zero: T): T => {
          a = a < zero ? (-a as T) : a;
          b = b < zero ? (-b as T) : b;
          if (b > a) {
            const temp = a;
            a = b;
            b = temp;
          }
          // eslint-disable-next-line no-constant-condition
          while (true) {
            if (b == zero) return a;
            a = (a % b) as T;
            if (a == zero) return b;
            b = (b % a) as T;
          }
        };
        expect(gcd(fibo(a), fibo(b), 0n)).toBe(fibo(gcd(a, b, 0)));
      })
    );
  });
});
