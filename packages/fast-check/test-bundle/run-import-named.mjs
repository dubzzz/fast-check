import { sample, nat } from 'fast-check';

console.log(await sample(nat(), { seed: 42, numRuns: 5 }));
