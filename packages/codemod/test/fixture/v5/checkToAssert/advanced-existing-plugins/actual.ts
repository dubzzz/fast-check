import * as fc from 'fast-check';

const { failed } = await fc.check(property, { seed: 42, plugins: [audit] });
console.log(failed);
