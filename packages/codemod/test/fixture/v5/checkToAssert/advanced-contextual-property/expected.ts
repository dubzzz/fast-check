import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
const out = (function<Ts>(checkProperty: Parameters<typeof fc.assert<Ts>>[0]) {
  let checkDetails: fc.RunDetails<Ts> | undefined;
  const checkExecution = fc.assert(checkProperty, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
  });
  if (checkDetails === undefined) {
    void Promise.resolve(checkExecution).catch(() => {});
    throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
  }
  return checkDetails;
})({
  ...property,
  generate(random, runId) {
    return property.generate(random, runId);
  },
});
console.log(out.failed);
