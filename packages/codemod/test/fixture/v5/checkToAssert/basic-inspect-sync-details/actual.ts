import * as fc from 'fast-check';

const details = fc.check(fc.property(fc.nat(), () => false));
console.log(details.failed);
