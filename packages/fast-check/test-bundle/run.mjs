import fc from 'fast-check';

console.log('Starting ' + import.meta.filename + '...');
console.log(fc.sample(fc.nat(), { seed: 42, numRuns: 5 }));
