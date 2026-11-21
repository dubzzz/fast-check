import * as fc from 'fast-check';

const events: string[] = [];
function setUp() {
  events.push('before');
}
function tearDown() {
  events.push('after');
}
fc.assert(fc.property(fc.integer(), Number.isInteger).beforeEach(setUp).afterEach(tearDown), { numRuns: 3 });
