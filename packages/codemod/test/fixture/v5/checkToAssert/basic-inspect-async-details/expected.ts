import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const checkProperty = property;
let checkDetails!: fc.RunDetails<ReturnType<typeof checkProperty.generate>['value']>;
await fc.assert(checkProperty, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
});
const details = checkDetails;
if (details.failed) console.log(details.counterexample);
