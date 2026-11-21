import * as fc from 'fast-check';

fc.logStatistics(await fc.statistics(fc.nat(), String));
