import { it as itVitest, test as testVitest } from 'vitest';
import * as fc from 'fast-check';
import { fuzz } from './internals/fuzz.js';
import { buildTest } from './internals/TestBuilder.js';

import type { FastCheckItBuilder } from './internals/TestBuilder.js';
import type { It } from './internals/types.js';

export const test: FastCheckItBuilder<It> = buildTest(testVitest, fc);
export const it: FastCheckItBuilder<It> = buildTest(itVitest, fc);
export { fc, fuzz };
