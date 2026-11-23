import * as fc from 'fast-check';

const property = fc.property(fc.nat(), () => false);
const { seed } = await fc.check(property, { seed: 42 });
console.log(seed);
