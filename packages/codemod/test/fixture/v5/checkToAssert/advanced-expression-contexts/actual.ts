import * as fc from 'fast-check';

const first = sideEffect(),
  failed = fc.check(property).failed;
const conditional = enabled && fc.check(property).failed;
for (const out = fc.check(property); out.failed;) break;
