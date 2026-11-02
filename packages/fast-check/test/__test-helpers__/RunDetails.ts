import * as fc from '../../src/fast-check.js';

/** Collect run details through a plugin without the default failure reporting. */
export function runDetails<Ts>(property: fc.Property<Ts>, params?: fc.Parameters<Ts>): Promise<fc.RunDetails<Ts>> {
  let details!: fc.RunDetails<Ts>;
  return fc
    .assert(property, {
      ...params,
      noDefaultPlugins: true,
      plugins: [
        ...(params?.plugins ?? []),
        () => ({
          onAllRunsComplete: (runDetails) => {
            details = runDetails;
          },
        }),
      ],
    })
    .then(() => details);
}
