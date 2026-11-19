import before from 'before';
import * as fc from 'fast-check';
import between from 'between';
import type * as types from 'fast-check';
import after from 'after';
const arb: types.Arbitrary<number> = fc.integer();
