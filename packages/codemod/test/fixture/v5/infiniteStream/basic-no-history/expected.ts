import * as fc from 'fast-check';

fc.iterator(fc.string(), {
  minLength: Infinity,
  noHistory: true
});
