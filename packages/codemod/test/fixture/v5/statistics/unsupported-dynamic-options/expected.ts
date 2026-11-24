import * as fc from 'fast-check';

// The options may contain a logger that must move to logStatistics.
await fc.statistics(fc.nat(), String, options);
