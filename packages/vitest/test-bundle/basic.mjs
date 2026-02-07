// Checking that our package can be properly imported by ES Module imports.
// It seems that in some cases, Vitest allow imports of invalid packages, with that dedicated
// test case, we make sure that the package is correct from a Node point of view.

globalThis.__vitest_worker__ = { config: { fakeTimers: undefined }, environment: { name: 'node' } };

import('@fast-check/vitest').then(
  () => {
    // In theory, Vitest is supposed to throw when imported outside of its own execution context
    // but we prefer not failing if it starts not to be the case anymore as it sounds rather like
    // testing an implementation detail of Vitest.
  },
  (err) => {
    if (
      err.message.includes('Vitest was initialized with native Node instead of Vite Node') &&
      err.stack.includes('at new VitestUtils')
    ) {
      // When Vitest throws because it was not executed in the right context we receive: raw Error thrown by VitestUtils.
      // We ignore errors linked to Vitest not being executed into the right context as this file is supposed not to be executed
      // with the right context so it's fully expected to throw at this point.
      return;
    }
    // When our modules are not properly defined, we receive: err.code === "ERR_MODULE_NOT_FOUND".
    // Or at least, it's one of the possible errors we could receive.
    throw err;
  },
);
