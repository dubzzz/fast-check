import { writeFileSync } from 'fs';
import { generateProperty } from './property';
import { generateTuple, generateTupleSpec } from './tuple';

const NUM_PARAMETERS = 22;

writeFileSync('./src/check/property/Property.generated.ts', generateProperty(NUM_PARAMETERS, false));
writeFileSync('./src/check/property/AsyncProperty.generated.ts', generateProperty(NUM_PARAMETERS, true));

writeFileSync('./src/check/arbitrary/TupleArbitrary.generated.ts', generateTuple(NUM_PARAMETERS));
writeFileSync('./test/unit/check/arbitrary/TupleArbitrary.generated.spec.ts', generateTupleSpec(NUM_PARAMETERS));
