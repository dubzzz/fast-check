import * as fc from 'fast-check';

const out = fc.check(property);
console.log(out.failed);
out.then(consume);
