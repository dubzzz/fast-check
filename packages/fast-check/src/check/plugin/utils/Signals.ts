import { PreconditionFailure } from '../../precondition/PreconditionFailure.js';
import type { PredicateExecutionContext } from '../../property/types/PredicateExecutionContext.js';
import type { PropertyFailure } from '../../property/types/PropertyFailure.js';

export function mergeSignals(
  executionContext: PredicateExecutionContext,
  extraSignal: AbortSignal,
): PredicateExecutionContext {
  const originalSignal = executionContext.signal;
  const signal = originalSignal === undefined ? extraSignal : AbortSignal.any([originalSignal, extraSignal]);
  return { ...executionContext, signal };
}

export function signalAsPromise(signal: AbortSignal): {
  promise: Promise<PreconditionFailure | PropertyFailure>;
  clear: () => void;
} {
  // oxlint-disable-next-line typescript/no-non-null-assertion
  let onAbort: () => void = null!;
  const promise = new Promise<PreconditionFailure | PropertyFailure>((resolve) => {
    onAbort = () => {
      const reason = signal.reason;
      resolve(PreconditionFailure.isFailure(reason) ? reason : { error: reason });
      signal.removeEventListener('abort', onAbort);
    };
    signal.addEventListener('abort', onAbort);
  });
  return { promise, clear: () => signal.removeEventListener('abort', onAbort) };
}
