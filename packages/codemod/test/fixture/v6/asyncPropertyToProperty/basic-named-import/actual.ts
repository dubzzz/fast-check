import { assert, asyncProperty, integer } from 'fast-check';

await assert(asyncProperty(integer(), async () => true));

export const builders = { asyncProperty };
export { asyncProperty };
