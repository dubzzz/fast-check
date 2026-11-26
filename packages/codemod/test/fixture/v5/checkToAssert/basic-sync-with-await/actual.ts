import * as fc from 'fast-check';

const out = fc.check(property);
console.log(out.failed);
await out;
const awaitedFirst = fc.check(property);
await awaitedFirst;
console.log(awaitedFirst.failed);
