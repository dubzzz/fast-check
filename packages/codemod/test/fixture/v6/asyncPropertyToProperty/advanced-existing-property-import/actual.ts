import { assert, asyncProperty, integer } from 'fast-check';
import { property } from 'another-library';

await assert(asyncProperty(integer(), async () => true));
property();
