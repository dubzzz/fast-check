import { it, fc } from '@fast-check/jest';

// should accept examples with stricter types than arbitraries without requiring explicit typings
// case coming from: https://github.com/facebook/jest/pull/13493
it.prop([fc.anything(), fc.anything()], { examples: [[0, 5e-324]] })('test', (_a, _b) => undefined);

// should accept examples with same types as arbitraries without requiring explicit typings
// case coming from: https://github.com/facebook/jest/pull/13493
it.prop([fc.double(), fc.double()], { examples: [[0, 5e-324]] })('test', (_a, _b) => undefined);

declare const var1: number | string;
// @ts-expect-error - should reject examples with types more generic than passed arbitraries
it.prop([fc.double(), fc.double()], { examples: [[var1, var1]] })('test', (_a, _b) => undefined);
