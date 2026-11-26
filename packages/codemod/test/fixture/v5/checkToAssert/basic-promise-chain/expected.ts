import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => true);
// The caller chains this promise; eagerly awaiting it would change the type of pending.
const pending = assertAndGetRunDetails(property);
pending.then(console.log);

assertAndGetRunDetails(property).then(console.log);
async function assertAndGetRunDetails<Ts>(property: Parameters<typeof fc.assert<Ts>>[0], params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
