import * as fc from 'fast-check';

const events: string[] = [];
fc.assert(
  fc.property(fc.integer(), Number.isInteger),
  { plugins: [fc.beforeEach(() => {
    events.push('start');
  }), fc.timeout(15)] },
);
