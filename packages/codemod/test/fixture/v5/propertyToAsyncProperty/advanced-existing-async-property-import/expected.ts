import { assert, nat, asyncProperty } from 'fast-check';

await assert(asyncProperty(nat(), (n) => true));
