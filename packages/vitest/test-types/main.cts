import { test, fc } from '@fast-check/vitest';

// Tuple notation
test.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  return (a + b + c).includes(b);
});

// Record notation
test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  return (a + b + c).includes(b);
});

// With advanced options
test.prop([fc.nat(), fc.nat()], { seed: 4242 })('should replay the test for the seed 4242', (a, b) => {
  return a + b === b + a;
});

// Nested test options
test.skip.prop([fc.string()])('should be skipped', (text) => {
  return text.length === text.length;
});
