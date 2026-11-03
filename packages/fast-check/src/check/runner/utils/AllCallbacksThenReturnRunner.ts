async function runAllCallbacksAndReturnAsync<T>(
  value: T,
  runCallbackAtIndex: (index: number) => void | Promise<void>,
  firstCallbackResult: Promise<void>,
  callbackIndex: number,
  callbacksCount: number,
  hasInitialError: boolean,
  initialError: unknown,
): Promise<T> {
  let interceptedOnce = hasInitialError;
  let interceptedError = initialError;
  for (let index = callbackIndex; index !== callbacksCount; ++index) {
    try {
      const out = index === callbackIndex ? firstCallbackResult : runCallbackAtIndex(index);
      if (out !== undefined) {
        await out;
      }
    } catch (error) {
      if (!interceptedOnce) {
        interceptedOnce = true;
        interceptedError = error;
      }
    }
  }
  if (interceptedOnce) {
    throw interceptedError;
  }
  return value;
}

/**
 * Run all callbacks in-order without any overlap.
 * Returns the originally passed value if all callbacks succeed, otherwise rejects with the first encountered error.
 * NEVER throw in a synchronous way!
 * @param value - Value returned on success (must not be a Promise or thenable)
 * @param runCallbackAtIndex - Execute the callback at a given index
 * @param callbacksCount - Number of callbacks to execute
 */
export function runAllCallbacksAndReturn<T>(
  value: T,
  runCallbackAtIndex: (index: number) => void | Promise<void>,
  callbacksCount: number,
): T | Promise<T> {
  let interceptedOnce = false;
  let interceptedError: unknown = undefined;
  for (let index = 0; index !== callbacksCount; ++index) {
    try {
      const out = runCallbackAtIndex(index);
      if (out !== undefined) {
        return runAllCallbacksAndReturnAsync(
          value,
          runCallbackAtIndex,
          out,
          index,
          callbacksCount,
          interceptedOnce,
          interceptedError,
        );
      }
    } catch (error) {
      if (!interceptedOnce) {
        interceptedOnce = true;
        interceptedError = error;
      }
    }
  }
  if (interceptedOnce) {
    return Promise.reject(interceptedError);
  }
  return value;
}
