import * as fc from 'fast-check';

const { failed } = await assertAndGetRunDetails(property, { seed: 42, plugins: [audit] });
console.log(failed);
async function assertAndGetRunDetails<Ts>(property: Parameters<typeof fc.assert<Ts>>[0], params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
