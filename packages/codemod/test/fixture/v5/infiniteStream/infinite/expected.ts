import * as fc from 'fast-check';

fc.iterator(fc.integer(), {
  minLength: Infinity
});
