import * as fc from 'fast-check';

// The options may contain a logger that must move to logStatistics.
fc.statistics(fc.nat(), String, options);
