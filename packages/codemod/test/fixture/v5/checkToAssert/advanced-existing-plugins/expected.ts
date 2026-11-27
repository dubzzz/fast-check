import * as fc from 'fast-check';

const checkProperty = property;
const checkParams: fc.Parameters<ReturnType<typeof checkProperty.generate>['value']> | undefined = { seed: 42, plugins: [audit] };
let checkDetails!: fc.RunDetails<ReturnType<typeof checkProperty.generate>['value']>;
await fc.assert(checkProperty, {
  ...checkParams,
  noDefaultPlugins: true,
  plugins: [...(checkParams?.plugins ?? []), () => ({ onAllRunsComplete(result) { checkDetails = result; } })],
});

const { failed } = checkDetails;
console.log(failed);
