import * as fc from 'fast-check';
function setUp() {
  reset();
}
function tearDown() {
  cleanup();
}
fc.assert(fc.property(arb, predicate), {
  numRuns: 3,
  plugins: [fc.beforeEach(setUp), fc.afterEach(tearDown)]
});
fc.check(fc.asyncProperty(arb, asyncPredicate), {
  plugins: [fc.afterEach(async () => {
    await cleanupAsync();
  })]
});
fc.assert(
  fc.property(arb, predicate),
  { plugins: [fc.beforeEach(() => {
    calls.push('start');
  }), fc.timeout(15)] },
);
fc.check(fc.property(arb, predicate), {
  plugins: [fc.afterEach(tearDown), ...(flag ? [fc.unbiased()] : [])],
});
