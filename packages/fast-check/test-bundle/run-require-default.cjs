const fc = require('fast-check');

fc.sample(fc.nat(), { seed: 42, numRuns: 5 }).then(console.log);
