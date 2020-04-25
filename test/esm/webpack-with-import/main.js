// eslint-disable-next-line
import fc from 'fast-check';

// eslint-disable-next-line
console.log(fc.__type);
fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => a + b === b + a));
