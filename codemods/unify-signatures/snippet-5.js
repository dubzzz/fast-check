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

// string

fc.string();
fc.string(5);
fc.string(1, 5);
fc.string({});

// stringOf

fc.stringOf(fc.char());
fc.stringOf(fc.char(), 5);
fc.stringOf(fc.char(), 1, 5);
fc.stringOf(fc.char(), {});

// subarray

fc.subarray([1, 2, 3]);
fc.subarray([1, 2, 3], 1, 2);

// shuffledSubarray

fc.shuffledSubarray([1, 2, 3]);
fc.shuffledSubarray([1, 2, 3], 1, 2);
fc.shuffledSubarray(myArray, 1, 2);
fc.shuffledSubarray(computeArray(), 1, 2);

// json

fc.json();
fc.json(2);
fc.json(10);
fc.json({ maxDepth: 10 });

// option

fc.option(fc.nat());
fc.option(fc.nat(), 10);
fc.option(fc.nat(), { freq: 10, nil: null });
