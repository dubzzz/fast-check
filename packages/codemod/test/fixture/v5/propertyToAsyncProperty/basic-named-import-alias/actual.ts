import { assert as plop, nat as plip, property as asyncProperty } from 'fast-check';

plop(asyncProperty(plip(), (n) => true));
