import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async () => true);
