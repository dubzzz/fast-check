import { assert as verify, integer, property } from 'fast-check';

const seen: number[] = [];
const example = property(integer(), (value) => {
  seen.push(value);
}).beforeEach(() => {
  seen.length = 0;
});
verify(example);
