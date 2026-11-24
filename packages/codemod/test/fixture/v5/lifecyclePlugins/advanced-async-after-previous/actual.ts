import * as fc from 'fast-check';

declare function flush(): Promise<void>;
await fc.assert(
  fc
    .asyncProperty(fc.nat(), async () => true)
    .afterEach(async (previous) => {
      await previous();
      await flush();
    }),
);
