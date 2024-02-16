import { jest } from '@jest/globals';
import fc from 'fast-check';

// Default timeout of 120s
const JestTimeoutMs = 120000;
const FcTimeoutMs = Math.floor(0.8 * JestTimeoutMs);

jest.setTimeout(JestTimeoutMs);
fc.configureGlobal({ interruptAfterTimeLimit: FcTimeoutMs, markInterruptAsFailure: true });
