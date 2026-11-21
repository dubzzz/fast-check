import * as fc from 'fast-check';

function format(details: fc.RunDetails<number>): string | undefined {
  // This synchronous return type cannot carry an asynchronously formatted message.
  return fc.defaultReportMessage(details);
}
