import fc from 'fast-check';

const FcTimeoutMs = Math.floor(0.8 * Number(process.env.TEST_TIMEOUT));
fc.configureGlobal({ interruptAfterTimeLimit: FcTimeoutMs, markInterruptAsFailure: true });
