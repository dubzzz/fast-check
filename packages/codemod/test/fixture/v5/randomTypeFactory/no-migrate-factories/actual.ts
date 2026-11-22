import { mersenne as factory } from 'pure-rand/generator/mersenne';
import * as fc from 'fast-check';

fc.configureGlobal({ randomType: factory });
fc.configureGlobal({ randomType: (seed) => factory(seed) });
