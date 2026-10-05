function runAllCallbacksAndReturnInternal<T>(
  value: T,
  callbacks: ((value: T) => void | Promise<void>)[],
  callbackIndex: number,
): T | Promise<T> {
  let interceptedOnce = false;
  let interceptedError: unknown = undefined;
  for (let index = callbackIndex; index !== callbacks.length; ++index) {
    const followUp = callbacks[index];
    try {
      const out = followUp(value);
      if (out !== undefined) {
        return out.then(
          () => runAllCallbacksAndReturnInternal(value, callbacks, index + 1),
          (error) => {
            const next = runAllCallbacksAndReturnInternal(value, callbacks, index + 1);
            if (next !== value) {
              return Promise.resolve(next).then(
                () => {
                  throw error;
                },
                () => {
                  throw error;
                },
              );
            }
            throw error;
          },
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

/**
 * Run all callbacks in-order without any overlap.
 * Returns the originally passed value in case all callbacks were successful and the first encountered error in case of error.
 * NEVER throw in a synchronous way!
 * @param value - The value to be passed to all callbacks and being returned by the function in case of success
 * @param callbacks - The callbacks to be executed
 */
export function runAllCallbacksAndReturn<T>(
  value: T,
  callbacks: ((value: T) => void | Promise<void>)[],
): T | Promise<T> {
  return runAllCallbacksAndReturnInternal(value, callbacks, 0);
}
