const fc = require('../../../lib/bundle');
console.log(fc.sample(fc.lorem(), { seed: 42, numRuns: 5 }));
