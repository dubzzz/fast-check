import fc from 'fast-check';

fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => a + b === b + a));
// Just a simple property, compiling a snippet importing fast-check
// should be enough to ensure that typings will not raise errors regarding incompatible
// and unknown syntaxes at build time
