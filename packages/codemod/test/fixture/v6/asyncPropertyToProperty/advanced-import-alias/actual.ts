import { assert, asyncProperty as build, asyncProperty as asyncProperty, integer } from 'fast-check';

await assert(build(integer(), async () => true));
await assert(asyncProperty(integer(), async () => true));
