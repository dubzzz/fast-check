import { integer as int, type Arbitrary } from 'fast-check';
import type { Parameters } from 'fast-check';
const arb: Arbitrary<number> = int();
const parameters: Parameters<[number]> = {};
