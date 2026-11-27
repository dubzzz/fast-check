import * as fc from 'fast-check';

const property = fc.property(fc.nat(), () => false);
const checkProperty = property;
const checkParams: fc.Parameters<ReturnType<typeof checkProperty.generate>['value']> | undefined = { seed: 42 };
let checkDetails!: fc.RunDetails<ReturnType<typeof checkProperty.generate>['value']>;
await fc.assert(checkProperty, {
  ...checkParams,
  noDefaultPlugins: true,
  plugins: [...(checkParams?.plugins ?? []), () => ({ onAllRunsComplete(result) { checkDetails = result; } })],
});
const { seed } = checkDetails;
console.log(seed);
