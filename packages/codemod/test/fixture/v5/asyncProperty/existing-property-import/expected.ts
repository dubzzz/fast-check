import { property, property as asyncProperty } from 'fast-check';
asyncProperty(arb, async (n) => n);
