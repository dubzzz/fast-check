import { assert, asyncProperty, integer } from 'fast-check';

const property = asyncProperty(integer(), async () => true);
await assert(property);
