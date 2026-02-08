const { pathToFileURL } = require('node:url');

try {
  const { init, fc } = require('@fast-check/jest/worker');
  const { test, expect } = init(pathToFileURL(__filename));

  test.prop([fc.constant(null)])('should pass', (value) => {
    expect(value).toBe(null);
  });
} catch (err) {
  if (err.code !== 'ERR_REQUIRE_ESM') {
    throw err;
  }
  // @fast-check/worker is ESM-only, require(esm) is not supported by Jest's CJS runtime.
  // The worker integration is verified via worker.spec.mjs instead.
  test.skip('should pass (skipped: @fast-check/worker is ESM-only)', () => {});
}
