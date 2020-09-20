import fc from 'fast-check';

// set
fc.set(fc.nat());
fc.set(fc.nat(), 5);
fc.set(fc.nat(), 1, 5);
fc.set(fc.nat(), function (a, b) {
  return a === b;
});
fc.set(fc.nat(), (a, b) => a === b);
fc.set(fc.nat(), 5, (a, b) => a === b);
fc.set(fc.nat(), 1, 5, (a, b) => a === b);
fc.set(fc.nat(), {});
