import type { AcquiredLock } from '../../../src/internals/lock/Lock.js';
import { Lock } from '../../../src/internals/lock/Lock.js';
import { describe, it, expect } from 'vitest';

describe('Lock', () => {
  it('should be able to take the first lock', async () => {
    // Arrange
    const lock = new Lock();

    // Act
    const { release } = await lock.acquire();

    // Assert
    await release();
  });

  it('should wait until previous lock gets released to access to it', async () => {
    // Arrange
    const lock = new Lock();
    const seenValues: number[] = [];
    let lastAcquiredLock: AcquiredLock | undefined = undefined;

    // Act
    lock.acquire().then((acquired) => {
      seenValues.push(1);
      lastAcquiredLock = acquired;
    });
    lock.acquire().then((acquired) => {
      seenValues.push(2);
      lastAcquiredLock = acquired;
    });
    lock.acquire().then((acquired) => {
      seenValues.push(3);
      lastAcquiredLock = acquired;
    });

    // Assert
    expect(seenValues).toEqual([]);
    await delay0();
    expect(seenValues).toEqual([1]);
    lastAcquiredLock!.release();
    await delay0();
    expect(seenValues).toEqual([1, 2]);
    lastAcquiredLock!.release();
    await delay0();
    expect(seenValues).toEqual([1, 2, 3]);
    lastAcquiredLock!.release();
  });
});

// Helpers

async function delay0() {
  await new Promise((r) => setTimeout(r, 0));
}
