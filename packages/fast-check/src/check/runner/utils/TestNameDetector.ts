/**
 * Extract filename from the first line after the last Runner line in stack trace
 *
 * HACK: This is a brittle approach that relies on stack trace parsing to determine
 * the test file name. This exists because fast-check is test framework agnostic
 * and does not have context of property names or test case identifiers.
 *
 * PREFERRED ALTERNATIVE: Use parameters.testCaseName to explicitly specify the test name
 * instead of relying on this stack trace parsing hack.
 */
export function getTestNameFromStackTrace(): string {
  try {
    const stack = new Error().stack;
    if (!stack) {
      return 'unknown_test';
    }

    const lines = stack.split('\n');
    let lastRunnerIndex = -1;

    // HACK: Find the last Runner line by string matching (ts or js)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('fast-check') && lines[i].includes('check/runner/Runner.')) {
        lastRunnerIndex = i;
      }
    }

    // HACK: Assume the next line contains the test file information
    if (lastRunnerIndex >= 0 && lastRunnerIndex + 1 < lines.length) {
      const nextLine = lines[lastRunnerIndex + 1];
      const match = nextLine.match(/([^/\\]+\.[jt]sx?):(\d+)/);
      if (match) {
        return `${match[1]}:${match[2]}`;
      }
    }

    return 'unknown';
  } catch (err) {
    return 'unknown';
  }
}
