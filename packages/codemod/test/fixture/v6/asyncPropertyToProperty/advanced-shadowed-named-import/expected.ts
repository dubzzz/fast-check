import { assert, property, integer } from 'fast-check';
import { asyncProperty as otherAsyncProperty } from 'another-library';

await assert(property(integer(), async () => true));

export function run(asyncProperty: () => boolean) {
  return asyncProperty();
}

{
  const asyncProperty = otherAsyncProperty;
  asyncProperty();
}

for (const asyncProperty of [otherAsyncProperty]) {
  asyncProperty();
}

await assert(property(integer(), async () => true));
