import { assert as plop, nat as plip, asyncProperty } from 'fast-check';

await plop(asyncProperty(plip(), (n) => true));
