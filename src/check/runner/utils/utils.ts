import { RunDetails } from '../reporter/RunDetails';

/** @hidden */
function prettyOne<Ts>(value: Ts): string {
  if (typeof value === 'string') return JSON.stringify(value);

  const defaultRepr: string = `${value}`;
  if (/^\[object (Object|Null|Undefined)\]$/.exec(defaultRepr) === null) return defaultRepr;
  try {
    return JSON.stringify(value);
  } catch (err) {
    // ignored: object cannot be stringified using JSON.stringify
  }
  return defaultRepr;
}

/** @hidden */
function pretty<Ts>(value: Ts): string {
  if (Array.isArray(value)) return `[${[...value].map(pretty).join(',')}]`;
  return prettyOne(value);
}

/** @hidden */
function throwIfFailed<Ts>(out: RunDetails<Ts>) {
  if (out.failed) {
    throw new Error(
      `Property failed after ${out.numRuns} tests (seed: ${out.seed}, path: ${out.counterexamplePath}): ${pretty(
        out.counterexample
      )}
Shrunk ${out.numShrinks} time(s)
Got error: ${out.error}`
    );
  }
}

export { throwIfFailed };
