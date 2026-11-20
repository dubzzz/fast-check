import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.assert(property, {
  plugins: [fc.interruptAfterTimeLimit(30, {
    failOnInterrupt: true
  })]
});
await fc.check(property, { markInterruptAsFailure: true, plugins: [fc.interruptAfterTimeLimit(30, {
  failOnInterrupt: true
})] });
await fc.assert(property, {
  markInterruptAsFailure: true,
  reporter: (details) => console.log(details.failed),
  plugins: [fc.interruptAfterTimeLimit(30, {
    failOnInterrupt: true
  })],
});
