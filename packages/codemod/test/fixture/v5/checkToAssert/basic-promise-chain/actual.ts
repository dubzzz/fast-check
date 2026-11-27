import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => true);
const pending = fc.check(property);
pending.then(console.log);
await pending;
fc.check(property).then(console.log);
fc.check(property)['then'](console.log);
