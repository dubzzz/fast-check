import { property, assert as verify } from 'fast-check';
const p = property(arb, predicate).beforeEach(() => {
  setUp();
});
verify(p);
