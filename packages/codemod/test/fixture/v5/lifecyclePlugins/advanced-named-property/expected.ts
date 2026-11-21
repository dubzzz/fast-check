import { assert as verify, integer, property } from 'fast-check';

import * as fc from 'fast-check';

const seen: number[] = [];
const example = property(integer(), (value) => {
  seen.push(value);
});
verify(example, {
  plugins: [fc.beforeEach(() => {
    seen.length = 0;
  })]
});
