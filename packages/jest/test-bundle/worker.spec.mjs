import { init, fc } from '@fast-check/jest/worker';

const { test, expect } = await init(new URL(import.meta.url));

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
