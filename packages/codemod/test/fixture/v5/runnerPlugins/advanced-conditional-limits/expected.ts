import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
declare const limit: number | undefined;
declare const enabled: boolean;
await fc.assert(property, {
  plugins: [
    ...(enabled === true ? [fc.skipEqualValues()] : []),
    ...(limit !== void 0 ? [fc.timeout(limit > 2147483647 ? 2147483647 : limit)] : [])
  ]
});
await fc.check(property, { plugins: [fc.timeout(2147483647)] });
