import { testProp, fc } from '@fast-check/jest';

testProp('should pass', [fc.constant(null)], (value) => {
  expect(value).toBe(null);
});
