import fc from 'fast-check';

import { CasCounter as Counter } from './src/CasCounter';
//import { Counter } from './src/Counter';
// import { SynchronizedCounter as Counter } from './src/SynchronizedCounter';

if (!fc.readConfigureGlobal()) {
  // Global config of Jest has been ignored, we will have a timeout after 5000ms
  // (CodeSandbox falls in this category)
  fc.configureGlobal({ interruptAfterTimeLimit: 4000 });
}

describe('Counter', () => {
  it('should handle two concurrent calls to "inc"', async () => {
    await fc.assert(
      fc.asyncProperty(fc.scheduler(), async (s) => {
        // Arrange
        let dbValue = 0;
        const db = {
          read: s.scheduleFunction(async function read() {
            return dbValue;
          }),
          write: s.scheduleFunction(async function write(newValue: number, oldValue?: number) {
            if (oldValue !== undefined && dbValue !== oldValue) return false;
            dbValue = newValue;
            return true;
          }),
        };
        const counter = new Counter(db);

        // Act
        s.schedule(Promise.resolve('inc1')).then(() => counter.inc());
        s.schedule(Promise.resolve('inc2')).then(() => counter.inc());
        await s.waitAll();

        // Assert
        expect(dbValue).toBe(2);
      })
    );
  });

  it('should handle concurrent calls to "inc"', async () => {
    await fc.assert(
      fc.asyncProperty(fc.scheduler(), fc.nat(64), async (s, numCalls) => {
        // Arrange
        let dbValue = 0;
        const db = {
          read: s.scheduleFunction(async function read() {
            return dbValue;
          }),
          write: s.scheduleFunction(async function write(newValue: number, oldValue?: number) {
            if (oldValue !== undefined && dbValue !== oldValue) return false;
            dbValue = newValue;
            return true;
          }),
        };
        const counter = new Counter(db);

        // Act
        for (let callId = 0; callId < numCalls; ++callId) {
          s.schedule(Promise.resolve(`inc${callId + 1}`)).then(() => counter.inc());
        }
        await s.waitAll();

        // Assert
        expect(dbValue).toBe(numCalls);
      })
    );
  });

  it('should handle concurrent calls to "inc" on multiple "Counter"', async () => {
    await fc.assert(
      fc.asyncProperty(fc.scheduler(), fc.array(fc.nat(64)), async (s, numCallsByCounter) => {
        // Arrange
        let dbValue = 0;
        const db = {
          read: s.scheduleFunction(async function read() {
            return dbValue;
          }),
          write: s.scheduleFunction(async function write(newValue: number, oldValue?: number) {
            if (oldValue !== undefined && dbValue !== oldValue) return false;
            dbValue = newValue;
            return true;
          }),
        };

        // Act
        let expectedNumCalls = 0;
        for (let counterId = 0; counterId < numCallsByCounter.length; ++counterId) {
          const counter = new Counter(db);
          const numCalls = numCallsByCounter[counterId];
          expectedNumCalls += numCalls;
          for (let callId = 0; callId < numCalls; ++callId) {
            s.schedule(Promise.resolve(`counter[${counterId}].inc${callId + 1}`)).then(() => counter.inc());
          }
        }
        await s.waitAll();

        // Assert
        expect(dbValue).toBe(expectedNumCalls);
      })
    );
  });
});

// Helpers
