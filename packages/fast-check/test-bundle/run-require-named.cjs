const { sample, nat } = require('fast-check');

console.log(sample(nat(), { seed: 42, numRuns: 5 }));
