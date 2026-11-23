import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => true);
// The caller chains this promise; eagerly awaiting it would change the type of pending.
const pending = fc.check(property);
pending.then(console.log);

fc.check(property).then(console.log);
