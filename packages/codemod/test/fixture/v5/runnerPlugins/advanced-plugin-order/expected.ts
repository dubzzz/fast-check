import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.assert(property, {
  plugins: [
    fc.beforeEach(() => {}),
    fc.ignoreEqualValues(),
    fc.unbiased(),
    fc.timeout(500)
  ]
});
