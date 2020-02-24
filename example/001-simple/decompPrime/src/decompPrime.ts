export const decompPrime = (n: number): number[] => {
  // Quick implementation: the maximal number supported is 2**31-1
  const stop = Math.sqrt(n);
  for (let i = 2; i <= stop; ++i) {
    if (n % i === 0) {
      return [i, ...decompPrime(Math.floor(n / i))];
    }
  }
  return [n];
};
