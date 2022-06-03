import fc from 'fast-check';

// Check proper version has been imported
// eslint-disable-next-line
console.log(fc.__type);

// Check fast-check can run simple properties
fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => a + b === b + a));

// Check global parameters are properly propagated to fc.assert
fc.configureGlobal({ numRuns: 0 });
fc.assert(fc.property(fc.nat(), () => false));
