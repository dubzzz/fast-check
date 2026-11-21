import { mersenne } from 'pure-rand/generator/mersenne';
import * as fc from 'fast-check';

fc.configureGlobal({ randomType: mersenne });
