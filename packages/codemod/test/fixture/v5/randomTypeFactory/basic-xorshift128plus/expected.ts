import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import * as fc from 'fast-check';

fc.configureGlobal({ randomType: xorshift128plus });
