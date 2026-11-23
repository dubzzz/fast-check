import { assert, property as build, property, integer } from 'fast-check';

await assert(build(integer(), async () => true));
await assert(property(integer(), async () => true));
