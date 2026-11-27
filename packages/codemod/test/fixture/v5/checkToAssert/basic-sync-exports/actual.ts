import * as fc from 'fast-check';

export const out = fc.check(property);
consume(out.failed);
const details = fc.check(property);
consume(details.failed);
export { details };
