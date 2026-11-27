import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => true);
const pending = fc.check(property);
pending.catch(console.error);
pending.finally(() => console.log('done'));
fc.check(property).catch(console.error);
fc.check(property).finally(() => console.log('done'));
