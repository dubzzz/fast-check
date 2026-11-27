import * as fc from 'fast-check';

let out = fc.check(property);
consume(out.failed);
const modified = fc.check(property);
modified.failed = true;
