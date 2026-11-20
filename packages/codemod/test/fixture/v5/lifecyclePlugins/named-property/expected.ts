import { property, assert as verify } from 'fast-check';
import * as fc from 'fast-check';
const p = property(arb, predicate);
verify(p, {
  plugins: [fc.beforeEach(() => {
    setUp();
  })]
});
