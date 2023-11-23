import fc from 'fast-check';
import { assert, propertyFor } from '@fast-check/worker';

const property = propertyFor(new URL('{{import.meta.url}}'));
const p1 = property(fc.string(), fc.nat(), (s, num) => {
  return s.length > num; // implicitly checking .length exists on s and num is a number
});
assert(p1, { timeout: 1000 }).then(() => {
  // not implemented
});
