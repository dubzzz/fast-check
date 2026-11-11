import { assert, asyncProperty } from 'fast-check';
await assert(asyncProperty(arb, async (n) => n));
