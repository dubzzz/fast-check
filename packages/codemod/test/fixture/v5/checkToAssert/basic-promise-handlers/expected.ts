import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => true);
const pending = assertAndGetRunDetails(property);
pending.catch(console.error);
pending.finally(() => console.log('done'));
assertAndGetRunDetails(property).catch(console.error);
assertAndGetRunDetails(property).finally(() => console.log('done'));
async function assertAndGetRunDetails<Ts>(property: Parameters<typeof fc.assert<Ts>>[0], params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
