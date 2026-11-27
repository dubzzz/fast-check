import * as fc from 'fast-check';

export const out = fc.check(property);
const details = fc.check(property);
export { details };
