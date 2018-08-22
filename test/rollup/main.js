const fc = require('../../lib/fast-check');
console.log(fc.sample(fc.lorem(), {seed: 42, numRuns: 5}));
