import { assert, nat, asyncProperty as property } from 'fast-check';
import { asyncProperty } from 'other';

await assert(property(nat(), (n) => true));
