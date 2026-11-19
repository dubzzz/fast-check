import * as fc from 'fast-check';
import * as fastCheck from 'fast-check';
import type * as types from 'fast-check';
import { type Arbitrary } from 'fast-check';
const arb: types.Arbitrary<number> = fastCheck.integer();
const other: Arbitrary<string> = fc.string();
