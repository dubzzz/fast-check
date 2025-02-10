import fc from 'fast-check';
import { VitestTimeoutMs } from './vitest.config';

const FcTimeoutMs = Math.floor(0.8 * VitestTimeoutMs);
fc.configureGlobal({ interruptAfterTimeLimit: FcTimeoutMs, markInterruptAsFailure: true });
