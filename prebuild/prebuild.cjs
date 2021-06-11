// @ts-check
const { writeFileSync } = require('fs');
const { generateProperty, generatePropertySpec } = require('./property.cjs');

const NUM_PARAMETERS = 22;

writeFileSync('./src/check/property/Property.generated.ts', generateProperty(NUM_PARAMETERS, false));
writeFileSync('./test/unit/check/property/Property.generated.spec.ts', generatePropertySpec(NUM_PARAMETERS, false));

writeFileSync('./src/check/property/AsyncProperty.generated.ts', generateProperty(NUM_PARAMETERS, true));
writeFileSync('./test/unit/check/property/AsyncProperty.generated.spec.ts', generatePropertySpec(NUM_PARAMETERS, true));
