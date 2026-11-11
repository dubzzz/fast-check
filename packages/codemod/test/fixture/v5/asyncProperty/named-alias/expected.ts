import { property as ap } from 'fast-check';
ap(arb, async (n) => n);
