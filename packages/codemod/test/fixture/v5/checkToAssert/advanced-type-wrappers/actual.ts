import * as fc from 'fast-check';

const details = await (fc.check(property) as Promise<fc.RunDetails<unknown>>);
console.log(details.failed);
const out = fc.check(property) as fc.RunDetails<unknown>;
consume(out.failed);
const optional = fc.check(property);
consume(optional?.failed);
const nonNull = fc.check(property);
consume(nonNull!.failed);
