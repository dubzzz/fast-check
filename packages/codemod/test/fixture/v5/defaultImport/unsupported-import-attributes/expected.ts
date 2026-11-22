import type fc from 'fast-check' with { 'resolution-mode': 'import' };

export type Value = fc.Arbitrary<number>;
