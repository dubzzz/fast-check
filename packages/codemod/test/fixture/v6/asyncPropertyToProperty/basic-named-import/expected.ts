import { assert, property, integer } from 'fast-check';

await assert(property(integer(), async () => true));

export const builders = { asyncProperty: property };
export { property as asyncProperty };
