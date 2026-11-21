import * as fc from 'fast-check';

const integers: fc.Arbitrary<number> = fc.integer();
const shrinks: IteratorObject<fc.Value<number>> = integers.shrink(42, undefined);
const smaller: number[] = shrinks.map((value) => value.value).toArray();

const property = fc.property(integers, fc.string(), (value, text, context) => {
  const signal: AbortSignal | undefined = context.signal;
  return typeof value === 'number' && typeof text === 'string' && signal?.aborted !== true;
});
const result: Promise<void> = fc.assert(property, { plugins: [fc.timeout(1000)] });
const samples: Promise<number[]> = fc.sample(integers);

// Type errors must still be reported when consuming the published declarations.
// @ts-expect-error - integer samples are numbers, not strings
const invalidSamples: Promise<string[]> = samples;

void smaller;
void result;
void invalidSamples;
