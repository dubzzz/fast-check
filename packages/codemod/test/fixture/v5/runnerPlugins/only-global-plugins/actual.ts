import { configureGlobal as configure } from 'fast-check';
configure({ interruptAfterTimeLimit: 15, markInterruptAsFailure: true });
