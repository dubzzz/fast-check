import before from 'before';
import fc from 'fast-check';
import between from 'between';
import type types from 'fast-check';
import after from 'after';
const arb: types.Arbitrary<number> = fc.integer();
