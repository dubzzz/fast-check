import fc from 'fast-check';
import * as url from 'url';

console.log('Starting ' + url.fileURLToPath(import.meta.url) + '...');
console.log(fc.sample(fc.nat(), { seed: 42, numRuns: 5 }));
