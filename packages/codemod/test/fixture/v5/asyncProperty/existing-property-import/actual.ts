import { property, asyncProperty } from 'fast-check';
asyncProperty(arb, async (n) => n);
