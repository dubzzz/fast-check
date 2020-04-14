export const decompPrime = (n: number): number[] => {
  // Quick implementation: the maximal number supported is 2**31-1
  let done = false;
  const factors: number[] = [];
  while (!done) {
    done = true;
    const stop = Math.sqrt(n);
    for (let i = 2; i <= stop; ++i) {
      if (n % i === 0) {
        factors.push(i);
        n = Math.floor(n / i);
        done = false;
        break;
      }
    }
  }
  return [...factors, n];
};
