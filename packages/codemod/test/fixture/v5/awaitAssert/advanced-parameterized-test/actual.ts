import * as fc from 'fast-check';

it.each([1, 2])('case %i', (n) => {
  fc.assert(makeProperty(n));
});
