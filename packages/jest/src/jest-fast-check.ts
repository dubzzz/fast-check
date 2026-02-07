import * as fc from 'fast-check';
import { it as itJest, test as testJest, jest } from '@jest/globals';
import { buildTest } from './internals/TestBuilder.js';

import type { FastCheckItBuilder } from './internals/TestBuilder.js';
import type { It } from './internals/types.js';

export const test: FastCheckItBuilder<It> = buildTest(testJest, jest, fc);
export const it: FastCheckItBuilder<It> = buildTest(itJest, jest, fc);

export { fc };
