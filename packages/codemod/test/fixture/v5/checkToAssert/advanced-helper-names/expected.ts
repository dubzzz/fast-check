import * as fc from 'fast-check';

const assertAndGetRunDetails = 'reserved';
const assertAndGetRunDetailsSync = 'reserved';
console.log(assertAndGetRunDetails, assertAndGetRunDetailsSync);
const property = fc.property(fc.nat(), (n) => n < 100);
const { failed } = assertAndGetRunDetailsSyncForCheck(property);
console.log(failed);
await assertAndGetRunDetailsForCheck(property);
function assertAndGetRunDetailsSyncForCheck<Ts>(property: Parameters<typeof fc.assert<Ts>>[0], params?: fc.Parameters<Ts>) {
  let details: fc.RunDetails<Ts> | undefined;
  const execution = fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  if (details === undefined) {
    if (execution !== undefined) void execution.catch(() => {});
    throw new Error('Expected synchronous check execution; use an asynchronous helper and await its result.');
  }
  return details;
}
async function assertAndGetRunDetailsForCheck<Ts>(property: Parameters<typeof fc.assert<Ts>>[0], params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
