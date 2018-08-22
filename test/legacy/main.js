// @ts-check
var assert = require('assert');
var fc = require('../../lib/fast-check');
var process = require('process');

function log() {
  process.stdout.write('.');
}

function testArbitrary(arb) {
  // should not crash if running a succesful property
  fc.assert(fc.property(arb, function() { return true; }));
  log();

  // should be able to detect failing runs and report them correctly
  // should be able to shrink with no crash
  var successfulAssert = true;
  try {
    var runId = 0;
    fc.assert(fc.property(arb, function() {
      return (runId++ % 3) === 0;
    }));
    successfulAssert = false;
  }
  catch (e) {
    successfulAssert = successfulAssert && e.constructor.name === 'Error';
    successfulAssert = successfulAssert && e.message.indexOf('Property failed after') === 0;
  }
  assert.ok(successfulAssert, 'Assert failed with an unexpected failure');
  log();

  // should be able to replay a failing case
  var runId = 0;
  var details = fc.check(fc.property(arb, function() {
    return (runId++ % 3) === 0;
  }));
  var replay = fc.sample(arb, {seed: details.seed, path: details.counterexamplePath});
  assert.deepEqual(replay[0], details.counterexample[0]);
  log();

  // should be able to retrieve statistics
  var stats = [];
  fc.statistics(arb, function(data) {
    return String(String(data).length);
  }, {logger: function(l) { stats.push(l); }});
  assert.notEqual(stats.length, 0);
  log();
}

testArbitrary(fc.nat());
testArbitrary(fc.array(fc.nat()));
testArbitrary(fc.json());
testArbitrary(fc.string());
testArbitrary(fc.fullUnicodeString());
testArbitrary(fc.lorem());
