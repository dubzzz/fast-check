import * as fc from 'fast-check';

const checkProperty = 'reserved';
const checkParams = 'reserved';
const checkDetails = 'reserved';
const checkExecution = 'reserved';
console.log(checkProperty, checkParams, checkDetails, checkExecution);
const property = fc.property(fc.nat(), (n) => n < 100);
const checkProperty2 = property;
const checkParams2: fc.Parameters<ReturnType<typeof checkProperty2.generate>['value']> | undefined = { seed: 42 };
let checkDetails2: fc.RunDetails<ReturnType<typeof checkProperty2.generate>['value']> | undefined;
const checkExecution2 = fc.assert(checkProperty2, {
  ...checkParams2,
  noDefaultPlugins: true,
  plugins: [...(checkParams2?.plugins ?? []), () => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
if (checkDetails2 === undefined) {
  void Promise.resolve(checkExecution2).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const { failed } = checkDetails2;
console.log(failed);
