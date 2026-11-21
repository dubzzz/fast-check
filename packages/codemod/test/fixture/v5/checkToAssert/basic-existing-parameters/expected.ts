import * as fc from 'fast-check';

const options = { seed: 42 };
await fc.assert(
  fc.property(fc.nat(), () => false),
  {
    ...options,
    noDefaultPlugins: true
  },
);
