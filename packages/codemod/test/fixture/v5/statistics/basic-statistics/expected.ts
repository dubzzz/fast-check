import * as fc from 'fast-check';

fc.logStatistics(await fc.statistics(fc.uuid(), String));
