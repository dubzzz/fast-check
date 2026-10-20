function runAllCallbacksAndReturnInternal<T>(
  value: T,
  runCallbackAtIndex: (index: number) => void | undefined | Promise<void | undefined>,
  callbackIndex: number,
  callbacksCount: number,
): T | Promise<T> {
  let interceptedOnce = false;
  let interceptedError: unknown = undefined;
  for (let index = callbackIndex; index !== callbacksCount; ++index) {
    try {
      const out = runCallbackAtIndex(index);
      if (out !== undefined) {
        return out.then(
          () => {
            const nested = runAllCallbacksAndReturnInternal(value, runCallbackAtIndex, index + 1, callbacksCount);
            if (interceptedOnce) {
              if (!Object.is(nested, value)) {
                return Promise.resolve(nested).then(
                  () => {
                    throw interceptedError;
                  },
                  () => {
                    throw interceptedError;
                  },
                );
              }
              throw interceptedError;
            }
            return nested;
          },
          (error) => {
            const next = runAllCallbacksAndReturnInternal(value, runCallbackAtIndex, index + 1, callbacksCount);
            const finalError = interceptedOnce ? interceptedError : error;
            if (!Object.is(next, value)) {
              return Promise.resolve(next).then(
                () => {
                  throw finalError;
                },
                () => {
                  throw finalError;
                },
              );
            }
            throw finalError;
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
 * @param value - The value to be passed to all callbacks and being returned by the function in case of success (T should not be a Promise)
 * @param callbacks - The callbacks to be executed
 */
export function runAllCallbacksAndReturn<T>(
  value: T,
  runCallbackAtIndex: (index: number) => void | Promise<void>,
  callbacksCount: number,
): T | Promise<T> {
  return runAllCallbacksAndReturnInternal(value, runCallbackAtIndex, 0, callbacksCount);
}
