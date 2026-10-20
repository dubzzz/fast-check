import * as fc from 'fast-check';

const FcTimeoutMs = Math.floor(0.8 * Number(process.env.TEST_TIMEOUT));
fc.installGlobalPlugin(fc.interruptAfterTimeLimit(FcTimeoutMs, { failOnInterrupt: true }));
