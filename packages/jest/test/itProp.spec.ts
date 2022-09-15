import { describe } from '@jest/globals';
import { itProp, fc } from '../src/jest-fast-check';

const delay = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), duration);
  });

describe('itProp', () => {
  // itProp

  itProp('should pass on truthy synchronous property', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
    return `${a}${b}${c}`.includes(b);
  });
  itProp('should pass on truthy asynchronous property', [fc.nat(), fc.string()], async (a, b) => {
    await delay(0);
    return typeof a === 'number' && typeof b === 'string';
  });
  itProp('should fail on falsy synchronous property', [fc.boolean()], (a) => a);
  itProp('should fail on falsy asynchronous property', [fc.nat()], async (a) => {
    await delay(0);
    return typeof a === 'string';
  });
  itProp('should fail with seed=4242 and path="25"', [fc.constant(null)], (_unused) => false, {
    seed: 4242,
    path: '25',
  });

  // itProp.skip

  itProp.skip('should never be executed', [fc.boolean()], (a) => a, { seed: 48 });
});
