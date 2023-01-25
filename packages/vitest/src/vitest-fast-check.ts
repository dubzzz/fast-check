import { it as itVitest, test as testVitest } from 'vitest';
import * as fc from 'fast-check';
import { buildTest } from './internals/TestBuilder';

import type { FastCheckItBuilder } from './internals/TestBuilder';
import type { It } from './internals/types';

export const test: FastCheckItBuilder<It> = buildTest(testVitest, fc);
export const it: FastCheckItBuilder<It> = buildTest(itVitest, fc);
export { fc };
