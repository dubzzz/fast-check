import * as fc from 'fast-check';
import type { UniversalPlugin } from '../../../src/internals/SharedTypes.js';

export function reportingParameters(): fc.Parameters<unknown> & {
  noDefaultPlugins?: boolean;
  includeErrorInReport?: boolean;
} {
  const defaultReporter = (fc as { defaultReporter?: (options: { includeErrorInReport: boolean }) => UniversalPlugin })
    .defaultReporter;
  return defaultReporter !== undefined
    ? { noDefaultPlugins: true, plugins: [defaultReporter({ includeErrorInReport: true })] }
    : { includeErrorInReport: true };
}
