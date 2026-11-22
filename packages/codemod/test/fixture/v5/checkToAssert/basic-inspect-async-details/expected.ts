import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const details = await assertAndGetRunDetails(property);
if (details.failed) console.log(details.counterexample);
async function assertAndGetRunDetails<Ts>(property: fc.Property<Ts>, params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
