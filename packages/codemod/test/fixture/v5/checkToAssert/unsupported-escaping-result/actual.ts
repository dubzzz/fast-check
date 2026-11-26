import * as fc from 'fast-check';

const out = fc.check(property);
consume(out);
consume(fc.check(property));
