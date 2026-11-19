import fc, { default as fastCheck, type default as types, type Arbitrary } from 'fast-check';
const arb: types.Arbitrary<number> = fastCheck.integer();
const other: Arbitrary<string> = fc.string();
