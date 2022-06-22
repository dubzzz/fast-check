import { testProp, fc } from '../src/jest-fast-check';

const delay = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), duration);
  });

// testProp

testProp('should pass on truthy synchronous property', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
  return `${a}${b}${c}`.includes(b);
});
testProp('should pass on truthy asynchronous property', [fc.nat(), fc.string()], async (a, b) => {
  await delay(0);
  return typeof a === 'number' && typeof b === 'string';
});
testProp('should fail on falsy synchronous property', [fc.boolean()], (a) => a);
testProp('should fail on falsy asynchronous property', [fc.nat()], async (a) => {
  await delay(0);
  return typeof a === 'string';
});
testProp('should fail with seed=4242 and path="25"', [fc.constant(null)], (_unused) => false, {
  seed: 4242,
  path: '25',
});

// testProp.skip

testProp.skip('should never be executed', [fc.boolean()], (a) => a, { seed: 48 });
