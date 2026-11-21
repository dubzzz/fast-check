import * as fc from 'fast-check';

function checkNow() {
  // This synchronous return is part of the caller's API; migrating it requires updating its consumers.
  return fc.check(property);
}
