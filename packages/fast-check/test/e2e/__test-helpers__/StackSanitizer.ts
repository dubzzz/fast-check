function sanitizeStack(initialMessage: string) {
  const lines = initialMessage
    .split('\n')
    .map((line) => (line.trimStart().startsWith('at ') ? line.replace(/\\/g, '/') : line))
    .join('\n')
    .replace(/at [^(]*fast-check\/(packages|node_modules)(.*):\d+:\d+/g, 'at $1$2:?:?') // line for the spec file itself
    .replace(/at (.*) \(.*fast-check\/(packages|node_modules)(.*):\d+:\d+\)/g, 'at $1 ($2$3:?:?)') // any import linked to internals of fast-check
    .replace(/at (.*) \(.*\/(\.yarn|Yarn)\/.*\/(node_modules\/.*):\d+:\d+\)/g, 'at $1 ($3:?:?)') // reducing risks of changes on bumps: .yarn (Linux and Mac), Yarn (Windows)
    .split('\n');
  // Drop internals of Jest from the stack: internals of jest, subject to regular changes and OS dependent
  const firstLineWithJest = lines.findIndex((line) => line.includes('node_modules/jest-'));
  if (firstLineWithJest !== -1) {
    const lastLineWithJest =
      lines.length - 1 - [...lines].reverse().findIndex((line) => line.includes('node_modules/jest-'));
    lines.splice(firstLineWithJest, lastLineWithJest - firstLineWithJest + 1);
  }
  return lines.filter((line) => !line.includes('node:internal')).join('\n');
}

type ErrorWithCause = Error & { cause: unknown };
const ErrorWithCause: new (message: string | undefined, options: { cause: unknown }) => Error = Error;

/** Wrap a potentially throwing code within a caller that would sanitize the returned Error */
export function runWithSanitizedStack(run: () => void) {
  return (): void => {
    try {
      run();
    } catch (err) {
      throw new ErrorWithCause(sanitizeStack((err as Error).message), { cause: (err as ErrorWithCause).cause });
    }
  };
}

/** Wrap a potentially throwing code within a caller that would sanitize the returned Error */
export function asyncRunWithSanitizedStack(run: () => Promise<void>) {
  return async (): Promise<void> => {
    try {
      await run();
    } catch (err) {
      throw new ErrorWithCause(sanitizeStack((err as Error).message), { cause: (err as ErrorWithCause).cause });
    }
  };
}
