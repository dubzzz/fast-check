import * as fc from 'fast-check';

declare function flush(): Promise<void>;
await fc.assert(fc
  .asyncProperty(fc.nat(), async () => true), {
  plugins: [fc.afterEach(async () => {
    await flush();
  })]
});
