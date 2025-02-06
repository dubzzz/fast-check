// @ts-check
var assert = require('assert');
var fc = require('fast-check');

function testArbitrary(arb) {
  // should not crash if running a succesful property
  fc.assert(
    fc.property(arb, function () {
      return true;
    }),
  );

  // should be able to detect failing runs and report them correctly
  // should be able to shrink with no crash
  var runId = 0;
  var successfulAssert = true;
  try {
    runId = 0;
    fc.assert(
      fc.property(arb, function () {
        return runId++ % 3 === 0;
      }),
    );
    successfulAssert = false;
  } catch (e) {
    successfulAssert = successfulAssert && e.constructor.name === 'Error';
    successfulAssert = successfulAssert && e.message.indexOf('Property failed after') === 0;
  }
  assert.ok(successfulAssert, 'Assert failed with an unexpected failure');

  // should be able to replay a failing case
  runId = 0;
  var details = fc.check(
    fc.property(arb, function () {
      return runId++ % 3 === 0;
    }),
  );
  var replay = fc.sample(arb, { seed: details.seed, path: details.counterexamplePath });
  assert.deepEqual(replay[0], details.counterexample[0]);

  // should be able to retrieve statistics
  var stats = [];
  fc.statistics(
    arb,
    function (data) {
      const dataWithPrototype =
        data !== null && typeof data === 'object' && Object.getPrototypeOf(data) === null
          ? Object.assign({}, data) // String(<no-prototype>) throws, we just put an Object prototype to not throw
          : data;
      return String(String(dataWithPrototype).length);
    },
    {
      logger: function (l) {
        stats.push(l);
      },
    },
  );
  assert.notEqual(stats.length, 0);
}

console.log('Starting ' + __filename + '...');
testArbitrary(fc.nat());
testArbitrary(fc.subarray([1, 42, 360]));
testArbitrary(fc.array(fc.nat()));
testArbitrary(fc.json());
testArbitrary(fc.string());
testArbitrary(fc.lorem());
testArbitrary(fc.uuid());
testArbitrary(fc.oneof(fc.nat(), fc.double()));
testArbitrary(fc.oneof({ weight: 1, arbitrary: fc.nat() }, { weight: 2, arbitrary: fc.double() }));
testArbitrary(fc.maxSafeInteger());
testArbitrary(fc.float({ noNaN: true })); // NaN is not properly recognize with assert.deepEqual
testArbitrary(fc.double({ noNaN: true }));
testArbitrary(fc.emailAddress());
testArbitrary(fc.webUrl());
testArbitrary(fc.int8Array());
testArbitrary(fc.int16Array());
testArbitrary(fc.int32Array());
testArbitrary(fc.float32Array());
testArbitrary(fc.float64Array());
testArbitrary(
  fc.mapToConstant(
    {
      num: 26,
      build: function (v) {
        return String.fromCharCode(v + 0x61);
      },
    },
    {
      num: 10,
      build: function (v) {
        return String.fromCharCode(v + 0x30);
      },
    },
  ),
);
testArbitrary(
  fc.letrec(function (tie) {
    return {
      tree: fc.oneof({ depthSize: 'small' }, tie('leaf'), tie('node')),
      node: fc.tuple(tie('tree'), tie('tree')),
      leaf: fc.nat(),
    };
  }).tree,
);
testArbitrary(
  (function () {
    const tree = fc.memo(function (n) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return fc.oneof(node(n), leaf());
    });
    const node = fc.memo(function (n) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
      return fc.record({ left: tree(), right: tree() });
    });
    const leaf = fc.nat;
    return tree();
  })(),
);
(function testGlobalParameters() {
  // Initial global parameters
  assert.deepStrictEqual(fc.readConfigureGlobal(), {});

  // Parameters after a first edit
  fc.configureGlobal({ numRuns: 123 });
  assert.deepStrictEqual(fc.readConfigureGlobal(), { numRuns: 123 });

  // Parameters after a reset
  fc.resetConfigureGlobal();
  assert.deepStrictEqual(fc.readConfigureGlobal(), {});

  // Parameters after a second edit (we set number of runs to zero)
  fc.configureGlobal({ numRuns: 0 });
  assert.deepStrictEqual(fc.readConfigureGlobal(), { numRuns: 0 });
  fc.assert(fc.property(fc.nat(), () => false));

  // Parameters after a reset
  fc.resetConfigureGlobal();
  assert.deepStrictEqual(fc.readConfigureGlobal(), {});
})();
