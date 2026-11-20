const { sample, nat } = require('fast-check');

sample(nat(), { seed: 42, numRuns: 5 }).then(console.log);
