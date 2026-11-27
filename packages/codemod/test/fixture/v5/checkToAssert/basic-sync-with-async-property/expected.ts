import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const checkProperty = property;
let checkDetails: fc.RunDetails<ReturnType<typeof checkProperty.generate>['value']> | undefined;
const checkExecution = fc.assert(checkProperty, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
});
if (checkDetails === undefined) {
  void Promise.resolve(checkExecution).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const out = checkDetails;
console.log(out.failed);
const checkProperty2 = fc.asyncProperty(fc.nat(), async () => false);
let checkDetails2: fc.RunDetails<ReturnType<typeof checkProperty2.generate>['value']> | undefined;
const checkExecution2 = fc.assert(checkProperty2, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
if (checkDetails2 === undefined) {
  void Promise.resolve(checkExecution2).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const { failed } = checkDetails2;
console.log(failed);
