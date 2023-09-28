const fc = require('fast-check');

console.log('Starting ' + __filename + '...');
console.log(fc.sample(fc.nat(), { seed: 42, numRuns: 5 }));
