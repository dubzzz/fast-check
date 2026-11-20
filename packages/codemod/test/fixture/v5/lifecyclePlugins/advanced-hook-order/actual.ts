import * as fc from 'fast-check';

const events: string[] = [];
fc.assert(
  fc.property(fc.integer(), Number.isInteger).beforeEach(() => events.push('start')),
  { plugins: [fc.timeout(15)] },
);
