import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
declare const limit: number | undefined;
declare const enabled: boolean;
await fc.assert(property, { timeout: limit, skipEqualValues: enabled });
