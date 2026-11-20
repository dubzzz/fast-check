import { configureGlobal as configure } from 'fast-check';
import * as fc from 'fast-check';

fc.installGlobalPlugin(fc.interruptAfterTimeLimit(15, {
  failOnInterrupt: true
}));
