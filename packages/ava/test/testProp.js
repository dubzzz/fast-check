const { testProp, fc } = require('../lib/ava-fast-check');

const delay = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

// testProp

testProp('should pass on truthy synchronous property', [fc.string(), fc.string(), fc.string()], (t, a, b, c) => {
  t.true(`${a}${b}${c}`.includes(b));
});
testProp('should pass on truthy asynchronous property', [fc.nat(), fc.string()], async (t, a, b) => {
  await delay(0);
  t.true(typeof a === 'number' && typeof b === 'string');
});
testProp('should fail on falsy synchronous property', [fc.boolean()], (t, a) => t.true(a));
testProp('should fail on falsy asynchronous property', [fc.nat()], async (t, a) => {
  await delay(0);
  t.true(typeof a === 'string');
});
testProp('should fail with seed=4242 and path="25"', [fc.constant(null)], (t) => t.fail(), { seed: 4242, path: '25' });
testProp('should pass on followed plan', [fc.array(fc.nat())], (t, array) => {
  t.plan(array.length);

  for (let i = 0; i < array.length; i++) {
    t.true(array[i] >= 0);
  }
});
testProp('should fail on not followed plan', [fc.array(fc.nat())], (t, array) => {
  t.plan(array.length + 1);

  for (let i = 0; i < array.length; i++) {
    t.true(array[i] >= 0);
  }
});
testProp('should pass kitchen sink', [fc.array(fc.nat())], (t, array) => {
  t.log('testing');
  t.false(array.some((value) => value < 0));

  const reduceSum = array.reduce((a, b) => a + b, 0);
  let forSum = 0;
  for (const value of array) {
    forSum += value;
  }
  t.is(forSum, reduceSum);

  t.deepEqual(array, Array.from(array));
  t.notDeepEqual(array, array.concat(1));
  t.falsy(array.reduce((a, b) => a + (b < 0), 0));
  t.throws(() => array());
});
testProp('should fail kitchen sink', [fc.array(fc.nat())], (t, array) => {
  t.log('testing');
  t.false(array.some((value) => value < 0));

  const reduceSum = array.reduce((a, b) => a + b, 0);
  let forSum = 0;
  for (const value of array) {
    forSum += value;
  }
  t.is(forSum, reduceSum);

  t.deepEqual(array, Array.from(array));
  t.notDeepEqual(array, array.concat(1));
  t.falsy(array.reduce((a, b) => a + (b < 0), 0));
  t.notThrows(() => array());
});

// testProp.failing

testProp.failing('should pass as the property fails', [fc.boolean()], (t, a) => t.true(a));
testProp.failing('should fail as the property passes', [fc.boolean()], (t, a) => t.true(a || !a));

// testProp.skip

testProp.skip('should never be executed', [fc.boolean()], (t, a) => t.true(a), { seed: 48 });

// testProp.serial

// Test that one serial run is after the other
let serialRun = false;
testProp.serial('should run first', [fc.boolean()], async (t, a) => {
  serialRun = true;
  await delay(0);
  t.true(a == a);
});
testProp.serial('should run after', [fc.boolean()], async (t, a) => {
  t.true(a == a && serialRun);
});

// Test that each execution of a test is run serially (and in order)
let runs = 0;
testProp.serial('should run serially', [fc.boolean()], async (t, a) => {
  let run = runs++;
  delay(a ? 1 : 0);
  t.true(a == a && runs == run + 1);
});
