const process = require('process');
const fc = require('./lib/fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

const seed = Date.now() ^ (Math.random() * 0x100000000);
console.log(`Using default seed: ${seed}`);
fc.configureGlobal({ seed });
