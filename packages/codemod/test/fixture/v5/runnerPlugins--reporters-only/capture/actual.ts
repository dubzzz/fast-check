import { assert } from 'fast-check';
let reporterCallback = chooseReporter();
assert(prop, { reporter: reporterCallback });
reporterCallback = anotherReporter;
