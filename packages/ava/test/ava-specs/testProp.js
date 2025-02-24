import { testProp, fc } from '../../lib/ava-fast-check.js';
import { Observable, map } from 'rxjs';

const delay = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });

// testProp

testProp(
  'should pass on no-failed asserts synchronous property',
  [fc.string(), fc.string(), fc.string()],
  (t, a, b, c) => {
    t.true(`${a}${b}${c}`.includes(b));
  },
);
testProp('should pass on no-failed asserts asynchronous property', [fc.nat(), fc.string()], async (t, a, b) => {
  await delay(0);
  t.true(typeof a === 'number' && typeof b === 'string');
});
testProp('should fail on failing asserts synchronous property', [fc.boolean()], (t, a) => t.true(a));
testProp('should fail on failing asserts asynchronous property', [fc.nat()], async (t, a) => {
  await delay(0);
  t.true(typeof a === 'string');
});
testProp(
  // WARINING: Diverge from fast-check's official behaviour
  'should fail on synchronous property not running any assertions even if returning undefined',
  [fc.constant(undefined)],
  (_t, c) => c,
);
testProp(
  // WARINING: Diverge from fast-check's official behaviour
  'should fail on asynchronous property not running any assertions even if returning undefined',
  [fc.constant(undefined)],
  async (_t, c) => c,
);
testProp(
  // WARINING: Diverge from fast-check's official behaviour
  'should fail on synchronous property not running any assertions even if returning true',
  [fc.constant(true)],
  (_t, c) => c,
);
testProp(
  // WARINING: Diverge from fast-check's official behaviour
  'should fail on asynchronous property not running any assertions even if returning true',
  [fc.constant(true)],
  async (_t, c) => c,
);
testProp(
  'should fail on synchronous property not running any assertions returning false',
  [fc.constant(false)],
  (_t, c) => c,
);
testProp(
  'should fail on asynchronous property not running any assertions returning false',
  [fc.constant(false)],
  async (_t, c) => c,
);
testProp(
  // WARINING: Diverge from fast-check's official behaviour
  'should pass on synchronous properties having only successful assertions even if returning false',
  [fc.nat()],
  (t, c) => {
    t.is(typeof c, 'number');
    return false;
  },
);
testProp(
  // WARINING: Diverge from fast-check's official behaviour
  'should pass on asynchronous properties having only successful assertions even if returning false',
  [fc.nat()],
  async (t, c) => {
    t.is(typeof c, 'number');
    return false;
  },
);
testProp('should pass on property returning passing Observable', [fc.array(fc.nat(), { minLength: 1 })], (t, data) => {
  t.plan(data.length);
  return new Observable((observer) => {
    data.forEach((value) => observer.next(value));
    observer.complete();
  }).pipe(map(() => t.pass()));
});
testProp('should fail on property returning failing Observable', [fc.array(fc.nat(), { minLength: 1 })], (t, data) => {
  t.plan(data.length + 1);
  return new Observable((observer) => {
    data.forEach((value) => observer.next(value));
    observer.complete();
  }).pipe(map(() => t.pass()));
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
testProp(
  'should ignore the result when fc.pre interrupted the execution on synchronous properties',
  [fc.nat()],
  (t, c) => {
    t.plan(1);
    fc.pre(c % 2 === 0); // ignore cases with c % 2 === 1
    t.is(c % 2, 0); // no assertion executed if c % 2 ===1, but given the reason it fc.pre, we want the test to pass
  },
);
testProp(
  'should ignore the result when fc.pre interrupted the execution on asynchronous properties',
  [fc.nat()],
  async (t, c) => {
    t.plan(1);
    fc.pre(c % 2 === 0); // ignore cases with c % 2 === 1
    t.is(c % 2, 0); // no assertion executed if c % 2 ===1, but given the reason it fc.pre, we want the test to pass
  },
);
testProp(
  'should ignore the result when fc.pre interrupted the execution on properties backed by Observables',
  [fc.array(fc.nat())],
  (t, data) => {
    t.plan(data.length);
    return new Observable((observer) => {
      data.forEach((value) => observer.next(value));
      observer.complete();
    }).pipe(
      map((v) => {
        fc.pre(v % data.length !== 0);
        t.pass();
      }),
    );
  },
);

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
