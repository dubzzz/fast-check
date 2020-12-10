// @ts-check
var assert = require('assert');
var fc = require('fast-check');

function testArbitrary(arb) {
  // should not crash if running a succesful property
  fc.assert(
    fc.property(arb, function () {
      return true;
    })
  );

  // should be able to detect failing runs and report them correctly
  // should be able to shrink with no crash
  var successfulAssert = true;
  try {
    var runId = 0;
    fc.assert(
      fc.property(arb, function () {
        return runId++ % 3 === 0;
      })
    );
    successfulAssert = false;
  } catch (e) {
    successfulAssert = successfulAssert && e.constructor.name === 'Error';
    successfulAssert = successfulAssert && e.message.indexOf('Property failed after') === 0;
  }
  assert.ok(successfulAssert, 'Assert failed with an unexpected failure');

  // should be able to replay a failing case
  var runId = 0;
  var details = fc.check(
    fc.property(arb, function () {
      return runId++ % 3 === 0;
    })
  );
  var replay = fc.sample(arb, { seed: details.seed, path: details.counterexamplePath });
  assert.deepEqual(replay[0], details.counterexample[0]);

  // should be able to retrieve statistics
  var stats = [];
  fc.statistics(
    arb,
    function (data) {
      return String(String(data).length);
    },
    {
      logger: function (l) {
        stats.push(l);
      },
    }
  );
  assert.notEqual(stats.length, 0);
}

testArbitrary(fc.nat());
testArbitrary(fc.subarray([1, 42, 360]));
testArbitrary(fc.array(fc.nat()));
testArbitrary(fc.json());
testArbitrary(fc.string());
testArbitrary(fc.fullUnicodeString());
testArbitrary(fc.lorem());
testArbitrary(fc.uuid());
testArbitrary(fc.frequency({ weight: 1, arbitrary: fc.nat() }, { weight: 2, arbitrary: fc.double() }));
testArbitrary(fc.maxSafeInteger());
testArbitrary(fc.float({ next: true, noNaN: true })); // NaN is not properly recognize with assert.deepEqual
testArbitrary(fc.double({ next: true, noNaN: true }));
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
    }
  )
);
testArbitrary(
  fc.letrec(function (tie) {
    return {
      tree: fc.oneof(tie('node'), tie('leaf'), tie('leaf')),
      node: fc.tuple(tie('tree'), tie('tree')),
      leaf: fc.nat(),
    };
  }).tree
);
testArbitrary(
  (function () {
    const tree = fc.memo(function (n) {
      return fc.oneof(node(n), leaf());
    });
    const node = fc.memo(function (n) {
      if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
      return fc.record({ left: tree(), right: tree() });
    });
    const leaf = fc.nat;
    return tree();
  })()
);
