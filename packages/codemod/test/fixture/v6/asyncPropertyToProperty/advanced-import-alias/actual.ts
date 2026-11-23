import { assert, asyncProperty as build, integer } from 'fast-check';

await assert(build(integer(), async () => true));
