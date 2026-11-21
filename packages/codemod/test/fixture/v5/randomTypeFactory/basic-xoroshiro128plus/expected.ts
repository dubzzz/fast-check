import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import * as fc from 'fast-check';

fc.configureGlobal({ randomType: xoroshiro128plus });
