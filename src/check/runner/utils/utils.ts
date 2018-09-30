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
export function pretty<Ts>(value: Ts): string {
  if (Array.isArray(value)) return `[${[...value].map(pretty).join(',')}]`;
  return prettyOne(value);
}

/** @hidden */
function throwIfFailed<Ts>(out: RunDetails<Ts>) {
  if (out.failed) {
    if (out.counterexample == null) {
      throw new Error(
        `Failed to run property, too many pre-condition failures encountered\n\nRan ${out.numRuns} time(s)\nSkipped ${
          out.numSkips
        } time(s)\n\nHint (1): Try to reduce the number of rejected values by combining map, flatMap and built-in arbitraries\nHint (2): Increase failure tolerance by setting maxSkipsPerRun to an higher value`
      );
    }
    throw new Error(
      `Property failed after ${out.numRuns} tests\n{ seed: ${out.seed}, path: "${
        out.counterexamplePath
      }" }\nCounterexample: ${pretty(out.counterexample)}\nShrunk ${out.numShrinks} time(s)\nGot error: ${
        out.error
      }\n\n${
        out.failures.length === 0
          ? 'Hint: Enable verbose mode in order to have the list of all failing values encountered during the run'
          : `Encountered failures were:\n- ${out.failures.map(pretty).join('\n- ')}`
      }`
    );
  }
}

export { throwIfFailed };
