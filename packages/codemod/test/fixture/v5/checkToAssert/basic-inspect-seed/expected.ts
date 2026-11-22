import * as fc from 'fast-check';

const property = fc.property(fc.nat(), () => false);
const { seed } = await assertAndGetRunDetails(property, { seed: 42 });
console.log(seed);
async function assertAndGetRunDetails<Ts>(property: fc.Property<Ts>, params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
