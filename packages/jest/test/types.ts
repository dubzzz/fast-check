import { itProp, fc } from '@fast-check/jest';

// should accept examples with stricter types than arbitraries without requiring explicit typings
// case coming from: https://github.com/facebook/jest/pull/13493
itProp('test', [fc.anything(), fc.anything()], (_a, _b) => undefined, { examples: [[0, 5e-324]] });

// should accept examples with same types as arbitraries without requiring explicit typings
// case coming from: https://github.com/facebook/jest/pull/13493
itProp('test', [fc.double(), fc.double()], (_a, _b) => undefined, { examples: [[0, 5e-324]] });

declare const var1: number | string;
// @ts-expect-error - should reject examples with types more generic than passed arbitraries
itProp('test', [fc.double(), fc.double()], (_a, _b) => undefined, { examples: [[var1, var1]] });
