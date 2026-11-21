import * as fc from 'fast-check';

const pending = readDefaultReportMessage(details);
function readDefaultReportMessage<Ts>(details: Extract<fc.RunDetails<Ts>, { failed: true }>): Promise<string>;
function readDefaultReportMessage<Ts>(details: Extract<fc.RunDetails<Ts>, { failed: false }>): Promise<undefined>;
function readDefaultReportMessage<Ts>(details: fc.RunDetails<Ts>): Promise<string | undefined>;
async function readDefaultReportMessage<Ts>(details: fc.RunDetails<Ts>): Promise<string | undefined> {
  const reporter = fc.defaultReporter()<Ts>(0, new Map());
  try {
    await reporter.onAllRunsComplete?.(details);
    return undefined;
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
}
