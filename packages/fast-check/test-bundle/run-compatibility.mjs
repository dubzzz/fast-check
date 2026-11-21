import * as fc from 'fast-check';
import checkCompatibility from './fixtures/compatibility.cjs';

await checkCompatibility(fc);
