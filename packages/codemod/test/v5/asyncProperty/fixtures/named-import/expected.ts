import { assert, property } from 'fast-check';
await assert(property(arb, async (n) => n));
