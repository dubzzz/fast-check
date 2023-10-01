import { assertNoPoisoning, restoreGlobals } from '@fast-check/poisoning';

// code possibly implying poisoning...
assertNoPoisoning(); // simple invocation
assertNoPoisoning({ ignoredRootRegex: /^console$/ }); // more complex invocation with ignored items
restoreGlobals(); // restoring any breakage
