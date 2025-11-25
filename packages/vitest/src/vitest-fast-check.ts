import * as fc from 'fast-check';
import { test as vitestTest } from 'vitest';
import { buildTest } from './internals/TestBuilder.js';
import { testAPIRefined } from './internals/TestAlongGenerator.js';

import type { FastCheckItBuilder } from './internals/TestBuilder.js';
import type { It } from './internals/types.js';

export const test: FastCheckItBuilder<It> = buildTest(vitestTest, testAPIRefined, fc);
export const it: FastCheckItBuilder<It> = test;
export { fc };
