import { mersenne } from 'pure-rand/generator/mersenne';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import * as fc from 'fast-check';

fc.configureGlobal({ randomType: mersenne });
fc.assert(fc.property(fc.integer(), Number.isInteger), { randomType: xorshift128plus });
