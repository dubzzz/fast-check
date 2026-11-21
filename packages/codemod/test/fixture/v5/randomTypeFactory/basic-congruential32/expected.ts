import { congruential32 } from 'pure-rand/generator/congruential32';
import * as fc from 'fast-check';

fc.configureGlobal({ randomType: congruential32 });
