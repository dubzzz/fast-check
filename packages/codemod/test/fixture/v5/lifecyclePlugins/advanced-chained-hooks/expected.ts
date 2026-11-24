import * as fc from 'fast-check';

const events: string[] = [];
function setUp() {
  events.push('before');
}
function tearDown() {
  events.push('after');
}
fc.assert(fc.property(fc.integer(), Number.isInteger), {
  numRuns: 3,
  plugins: [fc.beforeEach(setUp), fc.afterEach(tearDown)]
});
