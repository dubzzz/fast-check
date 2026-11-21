import * as fc from 'fast-check';

fc.statistics(fc.tuple(fc.string(), fc.nat()), ([text, n]) => text + n);
