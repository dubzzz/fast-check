import React, { useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
import styles from './Playgrounds.module.css';

// Does not queue at all
const queueCodeV0 = `export function queue(fun) {
  return fun;
}`;

// Only queue after last request
const queueCodeV1 = `export function queue(fun) {
  let lastQuery = Promise.resolve();
  return (...args) => {
    const currentQuery = fun(...args);
    const returnedQuery = lastQuery.then(() => currentQuery);
    lastQuery = currentQuery;
    return returnedQuery;
  };
}`;

// May still not queue enough due to early cleaning
const queueCodeV2 = `export function queue(fun) {
  let pastQueries = [];
  return (...args) => {
    const currentQuery = fun(...args);
    const returnedQuery = Promise.all(pastQueries)
      .finally(() => (pastQueries = []))
      .then(() => currentQuery);
    pastQueries.push(currentQuery);
    return returnedQuery;
  };
}`;

const queueCodeV3 = `export function queue(fun) {
  let pastQueries = [];
  return (...args) => {
    const currentQuery = fun(...args);
    const knownPastQueries = pastQueries;
    const returnedQuery = Promise.all(pastQueries)
      .finally(() => {
        if (knownPastQueries === pastQueries)
          pastQueries = [];
      })
      .then(() => currentQuery);
    pastQueries = [...pastQueries, currentQuery];
    return returnedQuery;
  };
}`;

const queueCodeV4 = `export function queue(fun) {
  let queryId = 0;
  let lastQuery = null;
  return (...args) => {
    const selfQueryId = ++queryId;
    if (lastQuery === null) {
      lastQuery = fun(...args);
    } else {
      lastQuery = lastQuery
        .then(
          () => fun(...args),
          () => fun(...args),
        );
    }
    lastQuery
      .finally(() => {
        if (queryId === selfQueryId)
          lastQuery = null;
      });
    return lastQuery;
  };
}`;

const queueCodeV5 = `export function queue(fun) {
  let pending = false;
  let onDone = [];
  function runNext() {
    if (onDone.length === 0) {
      pending = false;
      return;
    }
    onDone.shift()();
  }
  return (...args) => {
    if (!pending) {
      pending = true;
      const p = fun(...args);
      p.then(runNext, runNext);
      return p;
    }
    return new Promise((resolve, reject) => {
      onDone.push(() => {
        const p = fun(...args);
        p.then(runNext, runNext);
        p.then(resolve, reject);
      });
    });
  };
}`;

const queueUnitSpecCode = `import {queue} from './queue.js';

test('should resolve in call order', async () => {
  // Arrange
  const seenAnswers = [];
  const call = jest.fn()
    .mockImplementation(v => Promise.resolve(v));

  // Act
  const queued = queue(call);
  await Promise.all([
    queued(1).then(v => (seenAnswers.push(v))),
    queued(2).then(v => (seenAnswers.push(v))),
  ]);

  // Assert
  expect(seenAnswers).toEqual([1, 2]);
})`;

const queueBasicPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), async (s) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    pendingQueries.push(queued(1).then(v => (seenAnswers.push(v))));
    pendingQueries.push(queued(2).then(v => (seenAnswers.push(v))));
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual([1, 2]);
  }))
})`;

const queueBasicPBTWaitAllSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), async (s) => {
    // Arrange
    const seenAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    queued(1).then(v => (seenAnswers.push(v)));
    queued(2).then(v => (seenAnswers.push(v)));
    await s.waitAll();
  
    // Assert
    expect(seenAnswers).toEqual([1, 2]);
  }))
})`;

const queueMoreThan2CallsPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.integer({min: 1, max: 10}), async (s, numCalls) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    for (let id = 0 ; id !== numCalls ; ++id) {
      expectedAnswers.push(id);
      pendingQueries.push(queued(id).then(v => (seenAnswers.push(v))));
    }
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
  }))
})`;

const queueBatchesAlternativePBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.integer({min: 1, max: 10}), async (s, numCalls) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    for (let id = 0 ; id !== numCalls ; ++id) {
      pendingQueries.push(
        s.schedule(Promise.resolve(\`Fire the call for \${id}\`))
          .then(() => {
            expectedAnswers.push(id);
            return queued(id);
          })
          .then(v => (seenAnswers.push(v)))
      );
    }
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
  }))
})`;

const queueFromBatchesPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.array(fc.integer({min: 1, max: 10}), {minLength: 1}), async (s, batches) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
  
    // Act
    const queued = queue(s.scheduleFunction(call));
    let lastId = 0;
    const { task } = s.scheduleSequence(batches.map((batch, index) => {
      return {
        label: \`Fire batch #\${index + 1} (\${batch} calls)\`,
        builder: async () => {
          for (let id = 0 ; id !== batch ; ++id, ++lastId) {
            expectedAnswers.push(lastId);
            pendingQueries.push(queued(lastId).then(v => (seenAnswers.push(v))));
          }
        },
      }
    }));
    await s.waitFor(task);
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
  }))
})`;

const missingPartPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.array(fc.integer({min: 1, max: 10}), {minLength: 1}), async (s, batches) => {
    // Arrange
    const pendingQueries = [];
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
    const scheduledCall = s.scheduleFunction(call);
    let concurrentQueriesDetected = false;
    let queryPending = false;
    const monitoredScheduledCall = (...args) => {
      concurrentQueriesDetected ||= queryPending;
      queryPending = true;
      return scheduledCall(...args).finally(() => (queryPending = false));
    };
  
    // Act
    const queued = queue(monitoredScheduledCall);
    let lastId = 0;
    const { task } = s.scheduleSequence(batches.map((batch, index) => {
      return {
        label: \`Fire batch #\${index + 1} (\${batch} calls)\`,
        builder: async () => {
          for (let id = 0 ; id !== batch ; ++id, ++lastId) {
            expectedAnswers.push(lastId);
            pendingQueries.push(queued(lastId).then(v => (seenAnswers.push(v))));
          }
        },
      }
    }));
    await s.waitFor(task);
    await s.waitFor(Promise.all(pendingQueries));
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
    expect(concurrentQueriesDetected).toBe(false);
  }))
})`;

const extendedBackToWaitAllPBTSpecCode = `import {queue} from './queue.js';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(fc.asyncProperty(fc.scheduler(), fc.array(fc.integer({min: 1, max: 10}), {minLength: 1}), async (s, batches) => {
    // Arrange
    const seenAnswers = [];
    const expectedAnswers = [];
    const call = jest.fn()
      .mockImplementation(v => Promise.resolve(v));
    const scheduledCall = s.scheduleFunction(call);
    let concurrentQueriesDetected = false;
    let queryPending = false;
    const monitoredScheduledCall = (...args) => {
      concurrentQueriesDetected ||= queryPending;
      queryPending = true;
      return scheduledCall(...args).finally(() => (queryPending = false));
    };
  
    // Act
    const queued = queue(monitoredScheduledCall);
    let lastId = 0;
    s.scheduleSequence(batches.map((batch, index) => {
      return {
        label: \`Fire batch #\${index + 1} (\${batch} calls)\`,
        builder: async () => {
          for (let id = 0 ; id !== batch ; ++id, ++lastId) {
            expectedAnswers.push(lastId);
            queued(lastId).then(v => (seenAnswers.push(v)));
          }
        },
      }
    }));
    await s.waitAll();
  
    // Assert
    expect(seenAnswers).toEqual(expectedAnswers);
    expect(concurrentQueriesDetected).toBe(false);
  }))
})`;

const extendedWithExceptionsPBTSpecCode = `import {queue} from './queue.js';
import fc from "fast-check";

test("should resolve in call order", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.scheduler(),
      fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1 }),
      fc.func(fc.boolean()),
      async (s, batches, isFailure) => {
        // Arrange
        const seenAnswers = [];
        const expectedAnswers = [];
        const call = jest
          .fn()
          .mockImplementation((v) =>
            isFailure(v) ? Promise.reject(v) : Promise.resolve(v)
          );
        const scheduledCall = s.scheduleFunction(call);
        let concurrentQueriesDetected = false;
        let queryPending = false;
        const monitoredScheduledCall = (...args) => {
          concurrentQueriesDetected ||= queryPending;
          queryPending = true;
          return scheduledCall(...args).finally(() => (queryPending = false));
        };

        // Act
        const queued = queue(monitoredScheduledCall);
        let lastId = 0;
        s.scheduleSequence(
          batches.map((batch, index) => {
            return {
              label: \`Fire batch #\${index + 1} (\${batch} calls)\`,
              builder: async () => {
                for (let id = 0; id !== batch; ++id, ++lastId) {
                  expectedAnswers.push(
                    isFailure(lastId)
                      ? \`failure:\${lastId}\`
                      : \`success:\${lastId}\`
                  );
                  queued(lastId).then(
                    (v) => seenAnswers.push(\`success:\${v}\`),
                    (v) => seenAnswers.push(\`failure:\${v}\`)
                  );
                }
              }
            };
          })
        );
        await s.waitAll();

        // Assert
        expect(seenAnswers).toEqual(expectedAnswers);
        expect(concurrentQueriesDetected).toBe(false);
      }
    )
  );
})`;

function SetupPlayground(props) {
  const { startSpecCode, anwserSpecCode, fileContent, fileName, fileExtension } = props;
  const [specFile, setSpecFile] = useState({ key: 0, content: startSpecCode });

  return (
    <SandpackProvider
      key={specFile.key}
      theme={atomDark}
      files={{
        [`/${fileName}.${fileExtension}`]: {
          code: fileContent,
          readOnly: true,
          active: false,
          hidden: false,
        },
        [`/${fileName}.spec.${fileExtension}`]: {
          code: specFile.content,
          readOnly: false,
          active: true,
          hidden: false,
        },
      }}
      customSetup={{
        entry: `/${fileName}.${fileExtension}`,
        dependencies: {
          'fast-check': 'latest',
        },
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor style={{ height: 500 }} />
        <SandpackTests
          actionsChildren={
            <>
              <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: startSpecCode }))}>
                Reset snippet
              </button>
              {specFile.content !== anwserSpecCode && (
                <button onClick={() => setSpecFile((prev) => ({ key: prev.key + 1, content: anwserSpecCode }))}>
                  Show answer
                </button>
              )}
            </>
          }
          verbose
          style={{ height: 500 }}
        />
      </SandpackLayout>
      <div className={styles.openInCodeSandbox}>
        <UnstyledOpenInCodeSandboxButton>Open in CodeSandbox</UnstyledOpenInCodeSandboxButton>
      </div>
    </SandpackProvider>
  );
}

export function YourFirstRace() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV0}
      startSpecCode={queueUnitSpecCode}
      anwserSpecCode={queueBasicPBTSpecCode}
    />
  );
}

export function OneStepCloserToRealUsages() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV1}
      startSpecCode={queueBasicPBTSpecCode}
      anwserSpecCode={queueMoreThan2CallsPBTSpecCode}
    />
  );
}

export function MultipleBatchesOfCalls() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV2}
      startSpecCode={queueMoreThan2CallsPBTSpecCode}
      anwserSpecCode={queueFromBatchesPBTSpecCode}
    />
  );
}

export function MissingPart() {
  return (
    <SetupPlayground
      fileName="queue"
      fileExtension="js"
      fileContent={queueCodeV3}
      startSpecCode={queueFromBatchesPBTSpecCode}
      anwserSpecCode={missingPartPBTSpecCode}
    />
  );
}

function codeWithComments(code, comments) {
  return `${comments.map((line) => `// ${line}`).join('\n')}\n\n${code}`;
}
function pastImplementationSnippet(code, partName) {
  return codeWithComments(code, ['Implementation used within the part:', '> ' + partName]);
}
function pastTestSnippet(code, partName, variationName) {
  return codeWithComments(code, [
    'Test suggested for the part:',
    '> ' + partName,
    ...(variationName !== undefined ? [variationName] : []),
  ]);
}

export function WrapUpPlaygroundQueue() {
  const [reset, setReset] = useState(0);
  const queueImplementations = {
    'queue.v0.js': pastImplementationSnippet(queueCodeV0, 'Your first race condition test'),
    'queue.v1.js': pastImplementationSnippet(queueCodeV1, 'One step close to real usages'),
    'queue.v2.js': pastImplementationSnippet(queueCodeV2, 'Multiple batches of calls'),
    'queue.v3.js': pastImplementationSnippet(queueCodeV3, 'The missing part'),
    'queue.v4.js': codeWithComments(queueCodeV4, ['Pass all the tests of the tutorial']),
    'queue.v5.js': codeWithComments(queueCodeV5, ['Pass all the tests']),
  };
  const defaultQueueImplementation = 'queue.v5.js';
  const queueTests = {
    'queue.p0.spec.js': queueUnitSpecCode,
    'queue.p1.spec.js': pastTestSnippet(queueBasicPBTSpecCode, 'Your first race condition test'),
    'queue.p1.v2.spec.js': pastTestSnippet(
      queueBasicPBTWaitAllSpecCode,
      'Your first race condition test',
      'With waitAll'
    ),
    'queue.p2.spec.js': pastTestSnippet(queueMoreThan2CallsPBTSpecCode, 'One step close to real usages'),
    'queue.p3.spec.js': pastTestSnippet(queueFromBatchesPBTSpecCode, 'Multiple batches of calls'),
    'queue.p3.v2.spec.js': pastTestSnippet(
      queueBatchesAlternativePBTSpecCode,
      'Multiple batches of calls',
      'With delayed calls (no batches)'
    ),
    'queue.p4.spec.js': pastTestSnippet(missingPartPBTSpecCode, 'The missing part'),
    'queue.pnext.v1.spec.js': codeWithComments(extendedBackToWaitAllPBTSpecCode, [
      'Switch back to waitAll in queue.p4.spec',
    ]),
    'queue.pnext.v2.spec.js': codeWithComments(extendedWithExceptionsPBTSpecCode, ['Also cover error cases']),
  };
  const defaultQueueTest = 'queue.p4.spec.js';
  return (
    <SandpackProvider
      key={reset}
      theme={atomDark}
      files={{
        ...Object.fromEntries(
          Object.entries(queueImplementations).map(([fileName, fileContent]) => {
            return [
              `src/${fileName}`,
              {
                code: fileContent,
                readOnly: false,
                active: false,
                hidden: true,
              },
            ];
          })
        ),
        ...Object.fromEntries(
          Object.entries(queueTests).map(([fileName, fileContent]) => {
            return [
              `tests/${fileName}`,
              {
                code: fileContent.replace('./queue.js', './../src/queue.js'),
                readOnly: false,
                active: fileName === defaultQueueTest,
                hidden: fileName !== defaultQueueTest,
              },
            ];
          })
        ),
        'src/queue.js': {
          code: `export {queue} from './${defaultQueueImplementation}'`,
          readOnly: false,
          active: false,
          hidden: false,
        },
        'package.json': {
          code: JSON.stringify({ main: `src/queue.js` }),
          readOnly: true,
          active: false,
          hidden: true,
        },
      }}
      customSetup={{
        entry: `src/queue.js`,
        dependencies: {
          'fast-check': 'latest',
        },
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer style={{ height: 500 }} />
        <SandpackCodeEditor style={{ height: 500 }} />
        <SandpackTests
          actionsChildren={<button onClick={() => setReset((r) => r + 1)}>Reset snippets</button>}
          verbose
          style={{ height: 500 }}
        />
      </SandpackLayout>
      <div className={styles.openInCodeSandbox}>
        <UnstyledOpenInCodeSandboxButton>Open in CodeSandbox</UnstyledOpenInCodeSandboxButton>
      </div>
    </SandpackProvider>
  );
}
