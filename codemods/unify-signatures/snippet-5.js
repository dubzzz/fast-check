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

// option

fc.commands([]);
fc.commands([], 10);
fc.commands([], 50);
fc.commands([], { maxCommands: 50 });

// lorem

fc.lorem();
fc.lorem(5);
fc.lorem(10);
fc.lorem(num);
fc.lorem(5, true);
fc.lorem(10, true);
fc.lorem(10, false);
fc.lorem(10, something);
fc.lorem(num, something);
fc.lorem({ maxCount: 10 });

// bigInt

fc.bigInt();
fc.bigInt(1n, 3n);
fc.bigInt(BigInt(1), BigInt(3));
fc.bigInt({ min: 1n, max: 3n });

// bigUint

fc.bigUint();
fc.bigUint(3n);
fc.bigUint(BigInt(3));
fc.bigUint({ max: 3n });

// float

fc.float();
fc.float(1.0);
fc.float(2.0);
fc.float(0.0, 1.0);
fc.float(0.0, 2.0);
fc.float(-1.0, 1.0);
fc.float(-1.0, 2.0);
fc.float({ min: -1.0, max: 2.0 });

// nat

fc.nat();
fc.nat(10);
fc.nat(0x7fffffff);
fc.nat(2147483647);

// integer

fc.integer();
fc.integer(10);
fc.integer(0x7fffffff);
fc.integer(2147483647);
fc.integer(-1, 10);
fc.integer(-0x80000000, 0x7fffffff);
fc.integer(-2147483648, 2147483647);
fc.integer({ min: -1, max: 1 });
