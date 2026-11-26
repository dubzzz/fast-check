import * as fc from 'fast-check';

const dynamic = fc.check(property);
consume(dynamic[key]);
const unknown = fc.check(property);
consume(unknown.unknownField);
const extracted = fc.check(property);
const then = extracted.then;
