import { vi } from 'vitest';
import { describe, it, expect } from 'vitest';
import { Queue } from './queue.mjs';

describe('Queue', () => {
  it('should pass', () => {
    const queue = new Queue();
    expect(queue).toBeDefined();
  });
});
