import * as fc from 'fast-check';

const property = fc.property(fc.integer(), async () => true);
