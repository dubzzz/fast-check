import * as fc from 'fast-check';

// A global completion hook would also run on check, which ignores the legacy reporter.
fc.configureGlobal({ reporter: (details) => console.log(details.failed) });
fc.check(fc.property(fc.nat(), Number.isInteger));
