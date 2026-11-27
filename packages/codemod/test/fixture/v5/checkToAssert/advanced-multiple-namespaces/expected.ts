import * as fc from 'fast-check';
import * as other from 'fast-check';

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

const left = checkDetails;
console.log(left.failed);
const checkProperty2 = property;
let checkDetails2: other.RunDetails<ReturnType<typeof checkProperty2.generate>['value']> | undefined;
const checkExecution2 = other.assert(checkProperty2, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
if (checkDetails2 === undefined) {
  void Promise.resolve(checkExecution2).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const right = checkDetails2;
console.log(right.failed);
