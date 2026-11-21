import * as fc from 'fast-check';

const options = { seed: 42 };
fc.check(
  fc.property(fc.nat(), () => false),
  options,
);
