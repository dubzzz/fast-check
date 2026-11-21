import * as fc from 'fast-check';

it.each([1, 2])('case %i', async n => {
  await fc.assert(makeProperty(n));
});
