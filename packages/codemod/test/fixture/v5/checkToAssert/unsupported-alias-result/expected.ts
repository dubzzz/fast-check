import * as fc from 'fast-check';

const out = fc.check(property);
const alias = out;
consume(alias.failed);
