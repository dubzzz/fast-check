import * as fc from 'fast-check';

fc.statistics(fc.nat(), String, { logger: (line) => print(line) });
