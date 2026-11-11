import fc from 'fast-check';
const identity = <T>(n: T): T => n;
fc.property(arb, identity);
