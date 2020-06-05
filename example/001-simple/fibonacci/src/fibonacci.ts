export function fibo(n: number) {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i !== n; ++i) {
    const previousA = a;
    a = b;
    b = previousA + b;
  }
  return a;
}
