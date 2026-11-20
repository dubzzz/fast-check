const fc = require('fast-check');
fc.assert(prop, { plugins: [fc.timeout(25)] });
