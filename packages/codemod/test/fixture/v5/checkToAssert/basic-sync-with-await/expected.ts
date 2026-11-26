import * as fc from 'fast-check';

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
await out;
const checkProperty2 = property;
let checkDetails2: fc.RunDetails<ReturnType<typeof checkProperty2.generate>['value']> | undefined;
const checkExecution2 = fc.assert(checkProperty2, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
if (checkDetails2 === undefined) {
  void Promise.resolve(checkExecution2).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const awaitedFirst = checkDetails2;
await awaitedFirst;
console.log(awaitedFirst.failed);
