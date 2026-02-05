# Test async code

> **⚠️ Scope:** How to test asynchronous functions?

**🔧 Recommended tooling:** `vitest`, `fast-check`  
**🔧 Optional tooling:** `@fast-check/vitest`, `msw`

## If the function relies on several asynchronously retrieved values...

**✅ Do** write tests playing with relative ordering of async results

```ts
// With a function taking async helpers as input,
// queue: wraps calls to ensure results are returned in call order, not resolution order

// ❌ Problematic: implicitely tests one resolution order
it('should resolve in call order', async () => {
  // Arrange
  const seenAnswers = [];

  // Act
  const queued = queue((v) => Promise.resolve(v));
  await Promise.all([queued(1).then((v) => seenAnswers.push(v)), queued(2).then((v) => seenAnswers.push(v))]);

  // Assert
  expect(seenAnswers).toEqual([1, 2]);
});

// 🤷 Slightly better: only tests one resolution order controlled by the test
it('should resolve in call order even if Promise were resolved in reversed order', async () => {
  // Arrange
  const seenAnswers = [];
  const firstResult = Promise.withResolvers();
  const secondResult = Promise.withResolvers();
  const call = vi.fn().mockReturnValueOnce(firstResult.promise).mockReturnValueOnce(secondResult.promise);

  // Act
  const queued = queue(call);
  const task1 = queued(1).then((v) => seenAnswers.push(v));
  const task2 = queued(2).then((v) => seenAnswers.push(v));
  secondResult.resolve(2);
  firstResult.resolve(1);
  await Promise.all([task1, task2]);

  // Assert
  expect(seenAnswers).toEqual([1, 2]);
});

// ✅ Good: automatically tests different promise resolution orderings, catching race conditions that single-order tests miss
// We could have went even further by leveraging property based testing not only for the scheduler but also for the tasks themselves
it('should resolve in call order even if Promise were resolved in another order', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      // Arrange
      const seenAnswers = [];

      // Act
      const queued = queue(s.scheduleFunction((v) => Promise.resolve(v)));
      await s.waitFor(
        Promise.all([queued(1).then((v) => seenAnswers.push(v)), queued(2).then((v) => seenAnswers.push(v))]),
      );

      // Assert
      expect(seenAnswers).toEqual([1, 2]);
    }),
  );
});
```

**⚠️ Warning:** Only play with relative ordering if the test controls multiple asynchronous competing tasks

## If the function takes async helpers as input...

**✅ Do** cover the case of helpers being successful

**✅ Do** cover the case of helpers throwing errors

## If the function relies on API calls...

**✅ Do** suggest to change the implementation to avoid directy doing a `fetch` request from the code if how to fetch data is not the core mission of the function

```ts
// ❌ Problematic: knowing which end-point to call should be delegated to an helper function but not be inlined
async function getAllDependencies(packageName, acc = new Set()) {
  const response = await fetch(`https://domain/${encodeURIComponent(packageName)}`);
  const data = await response.json();
  for (const depName of data.dependencies) {
    acc.add(depName);
    await getAllDependencies(depName, acc);
  }
  return acc;
}

// ✅ Good: recommend extracting the fetching logic into an helper
// either imported (then mocked by tests) or passed to the function as a parameter (and stubbed by tests)
async function getAllDependencies(packageName, acc = new Set()) {
  const response = await getOnePackage(packageName);
  for (const depName of data.dependencies) {
    acc.add(depName);
    await getAllDependencies(depName, acc);
  }
  return acc;
}
```

**If changing the code was rejecting or not an option:**

- **✅ Do** use `msw` to intercept and mock network requests if installed

- **✅ Do** cover aborted API calls

## If the function relies on timers...

- **✅ Do** use fake timers by calling `vi.useFakeTimers()`

- **✅ Do** consider playing with ordering between timers and asynchronous results

```ts
// poll(fun, freq, count): call a 'fun' every 'freq' seconds and do it 'count' times.
// Two consecutive calls will be delayed by 'fun' no matter the time taken by 'fun' to resolve.
// If 'fun' is still running when attempting to call it again, the call will be postponed by 'freq' seconds.

// ❌ Problematic: not dealing with potential race condition between the timer and the calls
it('should issue one call every 3 seconds, 4 times', async () => {
  // Arrange
  vi.useFakeTimers();
  const freq = 3000;
  const fun = vi.fn().mockResolveValue(undefined);

  // Act
  poll(fun, freq, 4);
  await vi.advanceTimersByTimeAsync(freq);
  await vi.advanceTimersByTimeAsync(freq);
  await vi.advanceTimersByTimeAsync(freq);

  // Assert
  expect(fun).toHaveBeenCalledTimes(4);
});

// ✅ Good: consider the risk of potential race conditions between timers and asynchronous code
// By the way this new version of the test should certainly fail given the spec of the function
it('should issue one call every 3 seconds, 4 times', async () => {
  vi.useFakeTimers();
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      // Arrange
      const freq = 3000;
      const fun = vi.fn().mockImplementation(() => s.schedule(Promise.resolve()));
      s.schedule(Promise.resolve('Advance timers by 3s')).then(() => vi.advanceTimersByTimeAsync(freq));

      // Act
      poll(fun, freq, 4);
      await s.waitIdle();

      // Assert
      expect(fun).toHaveBeenCalledTimes(4);
    }),
  );
});
```
